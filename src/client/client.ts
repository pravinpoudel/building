import * as THREE from 'three'
import { Color, Scene, Vec2 } from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
// post proceesing helping tools
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier'
// ------------------------ generate octree from the mesh ------------------------------------------ //
import { Octree } from 'three/examples/jsm/math/Octree'
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper'
//
// capsule shaped geometry with AABB and intersection check function
import { Capsule } from 'three/examples/jsm/math/Capsule'
import * as CANNON from 'cannon-es'
import CannonUtils from './canonUitls'
import CannonDebugRenderer from './canonDebugRenderer'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import * as TWEEN from '@tweenjs/tween.js'
import { addLight, addCamera, addAnnotationSprite, onWindowResize } from './utils'
import { annotation } from './house_annotation'
import * as KeyBoardHandler from './KeyInputManager'

import './styles/style.css'
import { fail } from 'assert'

let scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.physicallyCorrectLights = true
// renderer.gammaFactor = 2.2

renderer.shadowMap.enabled = true
renderer.outputEncoding = THREE.sRGBEncoding

let world
const timeStep = 1 / 60

renderer.autoClear = false

let parameters: any = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
    stencilBuffer: false,
}

let renderTarget = new THREE.WebGLRenderTarget(512, 512, parameters)
//  it is saying this should match rendertargeta nd composerMap

renderer.setSize(window.innerWidth, window.innerHeight)

let composerScreen
let composerMap

const labelRenderer = new CSS2DRenderer()
const developerMode = false
let characterSize = 20
let box: THREE.Mesh
let controls: any
const clock = new THREE.Clock()

let camera: THREE.PerspectiveCamera
let playerCollider: Capsule
let raycaster: THREE.Raycaster
let annotationSprite = new THREE.Sprite()
let sceneObjects = new Array()
let RoomsItemBody = new Array()
let annotationLabels = new Array()
let pointer: THREE.Vector2 = new THREE.Vector2()
let annotationSpriteList: Array<THREE.Sprite> = []

let imageMap: THREE.Texture = new THREE.TextureLoader().load('textures/circle_texture.png')
window.addEventListener('click', checkAnnotationClick)

const menuBoard = document.getElementById('menuBoard') as HTMLDivElement
let mainscreen = document.getElementById('main-screen') as HTMLElement
// (start, end, radius)
playerCollider = new Capsule(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 20, 0), 10)
const sceneOctree = new Octree()
const modifier = new SimplifyModifier()

let playerSpeed = 5

let keys: any = {}
let deletedKeys: any = {}
let handlers: any = {}

let mapCamera,
    mapSizeX = 128,
    mapSizeY = 64

let right = 1024,
    left = -1024,
    top = 1024,
    bottom = -1024

function initMapCamera() {
    mapCamera = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 1000)
    // for camera to see down up should be on z axis
    mapCamera.up = new THREE.Vector3(0, 0, -1)
    mapCamera.lookAt(0, 0, 0)
    mapCamera.position.y = 512
    scene.add(mapCamera)
}

function init() {
    scene = addLight(scene)
    scene.background = new THREE.Color(0xffffff)
    camera = addCamera()
    createCharacter()
    // box.add(camera)

    raycaster = new THREE.Raycaster()

    const element = document.createElement('div') as HTMLElement
    labelRenderer.setSize(window.innerWidth, innerHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0px'
    labelRenderer.domElement.style.pointerEvents = 'none'
    document.body.appendChild(labelRenderer.domElement)

    renderer.setPixelRatio(window.devicePixelRatio)
    document.body.appendChild(renderer.domElement)

    document.addEventListener('mousemove', onPointerMove)

    async function load_model() {
        const gltfLoader = new GLTFLoader()
        await gltfLoader.setPath('./models/drawing_room/').load('scene.gltf', function (gltf) {
            console.log(gltf.scene)
            gltf.scene.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    console.log('hi')
                    const _child = child as THREE.Mesh
                    // computing bounding box for it's geometry
                    // we only have to compute it's bounding box because this is static mesh
                    _child.geometry.computeBoundingBox() //AABB
                    _child.castShadow = true
                    _child.receiveShadow = true
                    _child.scale.set(100, 100, 100)
                    sceneObjects.push(child)
                    // let verticesToRemove = Math.floor(
                    //     _child.geometry.attributes.position.count * 0.1
                    // )
                    // _child.geometry = modifier.modify(_child.geometry, verticesToRemove)
                }
                if (child instanceof THREE.Light) {
                    const _light = child as THREE.Light
                    _light.castShadow = true
                    _light.shadow.bias = 0.0008 // to reduce artifact in shadow
                    _light.shadow.mapSize.width = 1024
                    _light.shadow.mapSize.height = 1024
                }
            })
            scene.add(gltf.scene)

            {
                ;(document.getElementById('loader') as HTMLDivElement).style.display = 'none'
                ;(mainscreen as HTMLElement).style.display = 'block'
            }
        })
    }

    load_model()

    window.addEventListener('resize', onWindowResize)
}

function postProcessing(renderer) {
    composerScreen = new EffectComposer(renderer)

    // RenderPass is normally placed at the beginning of the chain in order to provide the rendered scene as an input for the next post-processing step.
    const renderPass = new RenderPass(scene, camera)
    // When using post-processing with WebGL, you have to use FXAA for antialiasing
    // Passing { antialias: true } to true when creating WebGLRenderer activates MSAA but only if you render to the default framebuffer
    // (directly to screen).
    const pixelRatio = 1
    let fxaaPass = new ShaderPass(FXAAShader)
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio)
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio)
    const copyPass1 = new ShaderPass(CopyShader)
    // meaning of renderToScreen. I have to set to true only for the 'last' effect
    copyPass1.renderToScreen = true
    composerScreen.addPass(renderPass)
    composerScreen.addPass(fxaaPass)
    composerScreen.addPass(copyPass1)
    // when screen is resized update fxaa resolution uniform as well

    // The width and height of the THREE.EffectComposer.renderTarget must match that of the WebGLRenderer.
    // #TODO: WHAT? Why? https://stackoverflow.com/questions/16167897/three-js-how-to-add-copyshader-after-fxaashader-r58
    composerMap = new EffectComposer(renderer, renderTarget)
    composerMap.setSize(512, 512)
    let renderPassMap = new RenderPass(scene, mapCamera)
    composerMap.addPass(renderPassMap)
    var effectFXAA_Map = new ShaderPass(FXAAShader)
    effectFXAA_Map.uniforms['resolution'].value.set(1 / 512, 1 / 512)
    composerMap.addPass(effectFXAA_Map)
    const copyPass = new ShaderPass(CopyShader)
    copyPass.renderToScreen = true
    composerMap.addPass(copyPass)
}

postProcessing(renderer)

function getCenterPoint(mesh) {
    var geometry = mesh.geometry
    geometry.computeBoundingBox()
    var center = new THREE.Vector3()
    geometry.boundingBox.getCenter(center)
    mesh.localToWorld(center)
    return center
}

function FPCLockHandler() {
    mainscreen.style.display = 'none'
}

function FPCUnLockHandler() {
    mainscreen.style.display = 'block'
}
let cotrolOptions = {
    FPC: true,
}
function intializeDemo_() {
    controls = new PointerLockControls(camera, document.body)
    controls.unlock()
    controls.addEventListener('lock', FPCLockHandler)
    controls.addEventListener('unlock', FPCLockHandler)

    document.getElementById('start-button')?.addEventListener('click', () => {
        if (cotrolOptions.FPC == true) {
            controls.lock()
        }
        // when user enter into the scene
        sceneObjects.forEach((element, index) => {
            let itemsBody: CANNON.Body = new CANNON.Body({
                mass: 0,
                shape: new CANNON.Sphere(5),
            })
            let target = new THREE.Vector3()
            target = getCenterPoint(element)
            itemsBody.position.copy(new CANNON.Vec3(target.x, target.y, target.z))
            world.addBody(itemsBody)
            RoomsItemBody.push(itemsBody)
        })
    })
}

function createCharacter() {
    var geometry = new THREE.BoxBufferGeometry(characterSize, characterSize, characterSize)
    var material = new THREE.MeshPhongMaterial({ color: 0x22dd88 })
    box = new THREE.Mesh(geometry, material)
    box.position.y = characterSize / 2
}
function performAnnotation(event: MouseEvent) {
    console.log(event)
    console.log('hello')
}

function keyPressWrapper(event) {
    keys = KeyBoardHandler.keyPress(event, keys)
}

function keyReleaseWrapper(event) {
    ;[deletedKeys, keys] = KeyBoardHandler.keyRelease(event, deletedKeys, keys)
}

function registerKeyWrapper() {
    handlers = KeyBoardHandler.registerKey(controls, handlers, keys, playerSpeed)
}

function checkAnnotationClick(event: MouseEvent) {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(annotationSpriteList, true)
    if (intersects.length > 0) {
        if (intersects[0].object.userData.annotationId != undefined) {
            const index = intersects[0].object.userData.annotationId
            const annotationData = annotation[index]
            displayDescription(index)
            // makeMove(annotationData)
        }
    }
}

function displayDescription(index: any) {
    console.log(index)
    let allDescDiv = document.getElementsByClassName('description-div')
    for (let i = 0, length = allDescDiv.length; i < length; i++) {
        ;(allDescDiv[i] as HTMLElement).style.display = 'none'
    }
    let visibleDiv = document.getElementById('label' + index) as HTMLElement
    visibleDiv.style.display = 'block'
}

function updateOpacity() {}

function loadAnnotationIntoScene() {
    const menuPanel = document.getElementById('menu-panel') as HTMLDivElement
    const _menuList = document.createElement('ul') as HTMLUListElement
    menuPanel.appendChild(_menuList)

    annotation.forEach((element, index) => {
        const myList = document.createElement('li') as HTMLLIElement
        const _list = _menuList.appendChild(myList)
        const myButton = document.createElement('button') as HTMLButtonElement
        _list.appendChild(myButton)
        myButton.classList.add('annotationButton')
        myButton.innerHTML = index + ' : ' + element['text']
        myButton.addEventListener(
            'click',
            () => {
                console.log('annotation clicked')
                // makeMove(element, index)
            },
            false
        )
        const material = new THREE.SpriteMaterial({
            map: imageMap,
            depthTest: false,
            depthWrite: false,
            sizeAttenuation: false,
            // depthTest: true,
        })
        //create annotation sprite and annotation label at lookat position
        const myAnnotationSprite = new THREE.Sprite(material)
        myAnnotationSprite.position.set(element.lookAt.x, element.lookAt.y, element.lookAt.z)
        myAnnotationSprite.userData.annotationId = index
        myAnnotationSprite.scale.set(0.1, 0.1, 0.1)
        scene.add(myAnnotationSprite)
        annotationSpriteList.push(myAnnotationSprite)

        const annotationLableDiv = document.createElement('div')
        annotationLableDiv.classList.add('a-label')
        annotationLableDiv.innerHTML = '' + index
        if (element.description != undefined) {
            const descriptionDiv = document.createElement('div') as HTMLElement
            descriptionDiv.classList.add('description-div')
            descriptionDiv.setAttribute('id', 'label' + index)
            descriptionDiv.innerHTML = element.description
            annotationLableDiv.appendChild(descriptionDiv)
        }
        const annotationLabelObject = new CSS2DObject(annotationLableDiv)
        annotationLabelObject.position.set(element.lookAt.x, element.lookAt.y, element.lookAt.z)
        // annotationLabels.push(annotationLabelObject)
        scene.add(annotationLabelObject)
    })
}

// loadAnnotationIntoScene()

function onPointerMove(event: MouseEvent) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

let lastTime = performance.now()

function physicsWorld() {
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.81, 0),
    })
    // world.gravity.set(0, -9.81, 0)
    // negative value in y axis make it go down
    world.broadphase = new CANNON.SAPBroadphase(world)
    world.defaultContactMaterial.friction = 0
}

function animate(now: number) {
    requestAnimationFrame(animate)
    // world.step(timeStep)
    const delta = now - lastTime
    lastTime = now
    TWEEN.update()
    KeyBoardHandler.keyUpdate(handlers, keys, delta)
    render()
}

let delta

function render() {
    delta = Math.min(+clock.getDelta, 0.2)
    world.step(delta)
    cannonDebugRenderer.update()
    composerScreen.render()
    composerMap.render()
    // composerScreen.renderer.render(scene, camera)
    // composerMap.renderer.render(scene, mapCamera)

    // labelRenderer.render(scene, camera)
}
physicsWorld()
const cannonDebugRenderer = new CannonDebugRenderer(scene, world)
init()

initMapCamera()
intializeDemo_()
registerKeyWrapper()
document.addEventListener('keydown', keyPressWrapper)
document.addEventListener('keyup', keyReleaseWrapper)
window.requestAnimationFrame(animate)

export { camera, renderer, labelRenderer, render }
