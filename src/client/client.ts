import * as THREE from 'three'
import { Color, FloatType, Scene, Vec2 } from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
// post proceesing helping tools
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier'
// ------------------------ generate octree from the mesh ------------------------------------------ //
import { Octree } from 'three/examples/jsm/math/Octree'
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper'

import { VRButton } from 'three/examples/jsm/webxr/VRButton'
// capsule shaped geometry with AABB and intersection check function
import { Capsule } from 'three/examples/jsm/math/Capsule'
import * as CANNON from 'cannon-es'
import CannonUtils from './canonUitls'
import CannonDebugRenderer from './canonDebugRenderer'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import * as TWEEN from '@tweenjs/tween.js'

import {
    addLight,
    addCamera,
    addAnnotationSprite,
    onWindowResize,
    createPhysicsBody,
    initDragController,
} from './utils'

import { annotation } from './house_annotation'
import * as KeyBoardHandler from './KeyInputManager'
import { convertFile } from './fileConverter'

import './styles/style.css'

let scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.physicallyCorrectLights = true

// renderer.gammaFactor = 2.2

renderer.shadowMap.enabled = true
// renderer.outputEncoding = THREE.sRGBEncoding

let world
const timeStep = 1 / 60

renderer.autoClear = false

let parameters: any = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    type: FloatType,
}

let renderTarget = new THREE.WebGLRenderTarget(256, 256, parameters)
//  it is saying this should match rendertargeta nd composerMap

renderer.setSize(window.innerWidth, window.innerHeight)

let composerScreen
let composerMap

const labelRenderer = new CSS2DRenderer()
const developerMode = false
let characterSize = new THREE.Vector3(100, 250, 100)
let box: THREE.Mesh
let controls: any
let orbitControls: OrbitControls
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

let _width = window.innerWidth
let _height = window.innerHeight
let right = 1024,
    left = -1024,
    top = 1024,
    bottom = -1024

let character
let aspectRatio = _width / _height

// --------------- Animation
let mixerOldGuy: THREE.AnimationMixer
let oldGuyLoaded: boolean = false
let ActionLists: Array<THREE.AnimationAction> = []
let activeAction: THREE.AnimationAction
let currentActiveAction: THREE.AnimationAction
const animationListObject: any = {
    default: () => setActiveAction(ActionLists[0]),
}
// ;(navigator.xr as XRSystem)
//     .isSessionSupported('immersive-vr')
//     .then((isSupported) => {
//         if (isSupported) {
//             document.body.appendChild(VRButton.createButton(renderer))
//             renderer.xr.enabled = true
//         }
//     })
//     .catch((err) => {
//         console.log('Immersive VR is not supported: ' + err)
//     })

// const gltfPipeline = require('gltf-pipeline')
// const fsExtra = require('fs-extra')
// const gltfToGlb = gltfPipeline.gltfToGlb
// const gltf = fsExtra.readJsonSync('./models/drawing_room/scene.gltf')
// gltfToGlb(gltf).then(function (results) {
//     fsExtra.writeFileSync('model.glb', results.glb)
// })

//----------------------------------------------------------------------
function setActiveAction(action: THREE.AnimationAction) {
    // we can do deep comparision between two object with stringify or lodash isEqual but even first layer equality check is enough for now
    if (action != currentActiveAction) {
        currentActiveAction.fadeOut(1)
        currentActiveAction = action
        action.reset()
        action.fadeIn(1)
        action.play()
    }
    // check if it is not the one going on right now
    // if not then change the active to this and stop last action
}
const fbxManager = new THREE.LoadingManager()
const fbxLoader = new FBXLoader(fbxManager)
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

fbxLoader.setPath('./models/oldPerson/').load('Boss.fbx', (object) => {
    // object->animations-> Array(1)->animationclip
    mixerOldGuy = new THREE.AnimationMixer(object)
    console.log(object)
    const action = mixerOldGuy.clipAction(object.animations[0])
    ActionLists.push(action)
    currentActiveAction = ActionLists[0]
    object.traverse(function (child) {
        if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.matrixAutoUpdate = false
        }
    })
    let center = new THREE.Vector3()
    let size = new THREE.Vector3()

    let box = new THREE.Box3().setFromObject(object) //compute AABB
    // get it's center and size
    box.getCenter(center)
    box.getSize(size)

    let maxSideDimension = Math.max(size.x, size.y, size.z)
    // normalize the men to unit size
    object.scale.multiplyScalar(1.0 / maxSideDimension)
    object.position.y += center.y
    object.position.x = -500
    object.quaternion.setFromEuler(new THREE.Euler(0, Math.PI / 1.5, 0))
    box.setFromObject(object)
    box.getCenter(center)
    box.getSize(size)
    object.position.y -= center.y / 2
    object.scale.multiplyScalar(150)

    scene.add(object)

    console.log(object.position.x)
    // once a scene is loaded load those animation file in chain

    fbxLoader.load('RumbaDancing.fbx', (object) => {
        const actionDance = mixerOldGuy.clipAction(object.animations[0])
        ActionLists.push(actionDance)
        let pos0 = ActionLists.length - 1
        animationListObject['dance'] = () => setActiveAction(ActionLists[1])
        fbxLoader.load('MoveOrder.fbx', (object) => {
            const actionMoveOrder = mixerOldGuy.clipAction(object.animations[0])
            ActionLists.push(actionMoveOrder)
            let pos1 = ActionLists.length - 1
            animationListObject['moveOrder'] = () => setActiveAction(ActionLists[2])
            fbxLoader.load('Salute.fbx', (object) => {
                const actionSalute = mixerOldGuy.clipAction(object.animations[0])
                ActionLists.push(actionSalute)
                let pos2 = ActionLists.length - 1
                animationListObject['salute'] = () => setActiveAction(ActionLists[3])
                fbxLoader.load('Walk.fbx', (object) => {
                    const actionWalk = mixerOldGuy.clipAction(object.animations[0])
                    ActionLists.push(actionWalk)
                    let pos3 = ActionLists.length - 1
                    animationListObject['walk'] = () => setActiveAction(ActionLists[4])
                    animationListObject['dance']()
                    oldGuyLoaded = true
                })
            })
        })
    })
})

function initMapCamera() {
    mapCamera = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 1000)
    // for camera to see down up should be on z axis
    mapCamera.up = new THREE.Vector3(0, 0, 1)
    mapCamera.lookAt(0, -1, 0)
    mapCamera.position.set(0, 0, 0)
    mapCamera.position.y = 500
    scene.add(mapCamera)
    // const helper = new THREE.CameraHelper(mapCamera)
    // scene.add(helper)
}

document.getElementById('gltfInput')?.addEventListener('change', (event) => {
    const [file] = (document.querySelector('input[type=file]') as HTMLInputElement).files as any
    convertFile(file)
})

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
        gltfLoader.setDRACOLoader(dracoLoader)
        await gltfLoader
            .setPath('./models/drawing_room/')
            .load('scene-merged-draco.glb', function (gltf) {
                console.log(gltf.scene.children[0])
                const modifier = new SimplifyModifier()
                gltf.scene.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
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
                gltf.scene.translateY
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
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader)

    // meaning of renderToScreen. I have to set to true only for the 'last' effect
    copyPass1.renderToScreen = true
    composerScreen.addPass(renderPass)
    composerScreen.addPass(fxaaPass)
    composerScreen.addPass(gammaCorrectionPass)
    composerScreen.addPass(copyPass1)
    // when screen is resized update fxaa resolution uniform as well

    // The width and height of the THREE.EffectComposer.renderTarget must match that of the WebGLRenderer.
    // #TODO: WHAT? Why? https://stackoverflow.com/questions/16167897/three-js-how-to-add-copyshader-after-fxaashader-r58
    composerMap = new EffectComposer(renderer, renderTarget)
    composerMap.setSize(256, 256)
    let renderPassMap = new RenderPass(scene, mapCamera)
    composerMap.addPass(renderPassMap)
    var effectFXAA_Map = new ShaderPass(FXAAShader)
    effectFXAA_Map.uniforms['resolution'].value.set(1 / 256, 1 / 256)
    composerMap.addPass(effectFXAA_Map)
    composerMap.addPass(gammaCorrectionPass)
    const copyPass = new ShaderPass(CopyShader)
    copyPass.renderToScreen = true
    composerMap.addPass(copyPass)
}

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

function createPhysicsBodyWrapper(event) {
    createPhysicsBody(event)
}

function intializeDemo_() {
    controls = new PointerLockControls(camera, document.body)
    controls.unlock()
    controls.addEventListener('lock', FPCLockHandler)
    controls.addEventListener('unlock', FPCLockHandler)

    orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.enableDamping = true
    orbitControls.dampingFactor = 0.05
    orbitControls.enabled = false

    renderer.domElement.addEventListener('dblclick', createPhysicsBodyWrapper)

    document.getElementById('start-button')?.addEventListener('click', () => {
        if (cotrolOptions.FPC == true) {
            controls.lock()
        }
        // when user enter into the scene
        // sceneObjects.forEach((element, index) => {
        //     let itemsBody: CANNON.Body = new CANNON.Body({
        //         mass: 0,
        //         shape: new CANNON.Sphere(5),
        //     })
        //     let target = new THREE.Vector3()
        //     target = getCenterPoint(element)
        //     itemsBody.position.copy(new CANNON.Vec3(target.x, target.y, target.z))
        //     world.addBody(itemsBody)
        //     RoomsItemBody.push(itemsBody)
        // })
    })
    // initDragController()
}

function createCharacter() {
    var geometry = new THREE.BoxGeometry(characterSize.x, characterSize.y, characterSize.z)
    var material = new THREE.MeshPhongMaterial({ color: 0xffffff })
    character = new THREE.Mesh(geometry, material)
    character.position.copy(camera.position)
    character.position.z = -227
    camera.add(character)
    scene.add(character)
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
            // displayDescription(index)
            makeMove(annotationData)
        }
    }
}

function displayDescription(index: any) {
    console.log(index)
    let allDescDiv = document.getElementsByClassName('description-div')
    console.log(allDescDiv)
    for (let i = 0, length = allDescDiv.length; i < length; i++) {
        ;(allDescDiv[i] as HTMLElement).style.display = 'none'
    }
    let visibleDiv = document.getElementById('label' + index) as HTMLElement
    visibleDiv.style.display = 'block'
}

function displayAllDescription() {
    let allDescDiv = document.getElementsByClassName('description-div')
    for (let i = 0, length = allDescDiv.length; i < length; i++) {
        ;(allDescDiv[i] as HTMLElement).style.display = 'block'
    }
    // let visibleDiv = document.getElementById('label' + index) as HTMLElement
    // visibleDiv.style.display = 'block'
}

function makeMove(params: any, index?: any) {
    new TWEEN.Tween(controls.getObject().position)
        .to(
            {
                x: params.cameraPosition.x,
                y: params.cameraPosition.y,
                z: params.cameraPosition.z,
            },
            1000
        )
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
        .onUpdate(() => {
            controls.getObject().lookAt(params.lookAt.x, params.lookAt.z, params.lookAt.z)
            controls.getObject().updateProjectionMatrix()
        })

    // manual way of calculating lookat of the camera
    var vector = new THREE.Vector3(0, 0, -1)
    vector.applyQuaternion(camera.quaternion)

    let rotateY = vector.angleTo(
        new THREE.Vector3(params.lookAt.x, params.lookAt.y, params.lookAt.z)
    )
    // finding lookat of a pointer lock controls camera
    let v = new THREE.Vector3()
    controls.getDirection(v)

    // new TWEEN.Tween(camera.lookAt)
    //     .to(
    //         {
    //             x: params.lookAt.x,
    //             y: params.lookAt.y,
    //             z: params.lookAt.z,
    //         },
    //         2500
    //     )
    //     .easing(TWEEN.Easing.Cubic.Out)
    //     .start()
    //     .onUpdate(controls.getObject().updateProjectionMatrix())

    if (index != undefined) {
        displayDescription(index)
    }
    // camera.position.set(params.cameraPosition.x, params.cameraPosition.y, params.cameraPosition.z)
    // controls.target.set(params.lookAt.x, params.lookAt.y, params.lookAt.z)
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
                makeMove(element, index)
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
        annotationLabels.push(annotationLabelObject)
        scene.add(annotationLabelObject)
    })
}

loadAnnotationIntoScene()
displayAllDescription()
window.addEventListener('click', checkAnnotationClick)

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

    const planeShape = new CANNON.Plane()
    const planeBody = new CANNON.Body({ mass: 0 })
    planeBody.addShape(planeShape)
    planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    planeBody.position.y += 50
    world.addBody(planeBody)
}

function animate(now: number) {
    requestAnimationFrame(animate)
    let delta = clock.getDelta()
    delta = Math.max(delta, 0.1)
    world.step(delta)
    if (orbitControls.enabled) {
        orbitControls.update()
    }
    if (oldGuyLoaded) {
        mixerOldGuy.update(delta)
    }
    // console.log(cannonDebugRenderer)
    cannonDebugRenderer.update()
    TWEEN.update()
    KeyBoardHandler.keyUpdate(handlers, keys, delta * 1000)
    if (character) {
        character.position.copy(camera.position)
        // console.log(character.position)
    }
    render(delta)
}

function render(delta) {
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
    composerScreen.render(delta)
    renderer.clear(false, true, false)
    renderer.setViewport(20, window.innerHeight - 256, 256, 256)
    composerMap.render(delta)
    labelRenderer.render(scene, camera)
    // scene.background = new THREE.Color(0xffffff)
}
physicsWorld()
const cannonDebugRenderer = new CannonDebugRenderer(scene, world)
init()

initMapCamera()

postProcessing(renderer)
intializeDemo_()
registerKeyWrapper()
document.addEventListener('keydown', keyPressWrapper)
document.addEventListener('keyup', keyReleaseWrapper)
window.requestAnimationFrame(animate)

export {
    camera,
    renderer,
    labelRenderer,
    render,
    animationListObject,
    pointer,
    raycaster,
    sceneObjects,
    world,
    controls,
    clock,
    scene,
    orbitControls,
}
