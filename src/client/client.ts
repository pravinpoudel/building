import * as THREE from 'three'
import { Vec2 } from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import * as TWEEN from '@tweenjs/tween.js'
import { addLight, addCamera, addAnnotationSprite } from './utils'
import { annotation } from './house_annotation'
import * as KeyBoardHandler from './KeyInputManager'

import './styles/style.css'
import { fail } from 'assert'

let scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({ antialias: true })
const labelRenderer = new CSS2DRenderer()
const developerMode = false
let characterSize = 20
let box: THREE.Mesh
let controls: PointerLockControls
const clock = new THREE.Clock()

let camera: THREE.PerspectiveCamera
let raycaster: THREE.Raycaster
let annotationSprite = new THREE.Sprite()
let sceneObjects = new Array()
let annotationLabels = new Array()
let pointer: THREE.Vector2 = new THREE.Vector2()
let annotationSpriteList: Array<THREE.Sprite> = []

let imageMap: THREE.Texture = new THREE.TextureLoader().load('textures/circle_texture.png')
window.addEventListener('click', checkAnnotationClick)

const forward = new THREE.Vector3(0, 0, -1)
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const vertex = new THREE.Vector3()
const color = new THREE.Color()

const menuBoard = document.getElementById('menuBoard') as HTMLDivElement
let mainscreen = document.getElementById('main-screen') as HTMLElement

let playerSpeed = 5
let fpcListener = true
let manuallyLocked = false

let keys: any = {}
let deletedKeys: any = {}
let handlers: any = {}
let releaser: any = {}

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

    renderer.shadowMap.enabled = true

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    document.addEventListener('mousemove', onPointerMove)

    async function load_model() {
        const objLoader = new OBJLoader()
        const gltfLoader = new GLTFLoader()

        let MeshGeomState = []
        await gltfLoader.setPath('./models/').load('scene.gltf', function (gltf) {
            gltf.scene.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    const _child = child as THREE.Mesh
                    // computing bounding box for it's geometry
                    // we only have to compute it's bounding box because this is static mesh
                    _child.geometry.computeBoundingBox() //AABB
                    _child.castShadow = true
                    _child.receiveShadow = true
                    _child.scale.set(100, 100, 100)
                    sceneObjects.push(_child)
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
        })
        {
            ;(document.getElementById('loader') as HTMLDivElement).style.display = 'none'
            ;(mainscreen as HTMLElement).style.display = 'block'
        }
    }

    load_model()

    window.addEventListener('resize', onWindowResize)
}

function intializeDemo_() {
    controls = new PointerLockControls(camera, document.body)
    controls.unlock()
    controls.addEventListener('lock', () => (mainscreen.style.display = 'none'))
    controls.addEventListener('unlock', () => {
        mainscreen.style.display = 'block'
    })
    document.getElementById('start-button')?.addEventListener('click', () => {
        controls.lock()
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

// function makeMove(params: any, index?: any) {
//     new TWEEN.Tween(camera.position)
//         .to(
//             {
//                 x: params.cameraPosition.x,
//                 y: params.cameraPosition.y,
//                 z: params.cameraPosition.z,
//             },
//             1000
//         )
//         .easing(TWEEN.Easing.Cubic.Out)
//         .start()

//     new TWEEN.Tween(controls.target)
//         .to(
//             {
//                 x: params.lookAt.x,
//                 y: params.lookAt.y,
//                 z: params.lookAt.z,
//             },
//             2500
//         )
//         .easing(TWEEN.Easing.Cubic.Out)
//         .start()
//     if (index != undefined) {
//         displayDescription(index)
//     }
//     // camera.position.set(params.cameraPosition.x, params.cameraPosition.y, params.cameraPosition.z)
//     // controls.target.set(params.lookAt.x, params.lookAt.y, params.lookAt.z)
// }

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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function onPointerMove(event: MouseEvent) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

let lastTime = performance.now()
function animate(now: number) {
    requestAnimationFrame(animate)
    const delta = now - lastTime
    lastTime = now
    TWEEN.update()
    KeyBoardHandler.keyUpdate(handlers, keys, delta)
    if (developerMode) {
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(scene.children, true)
        if (intersects.length > 0) {
            let result = new THREE.Vector3()
            camera.getWorldPosition(result)
            console.log(result)
            console.log(intersects[0].point)
        }
    }
    render()
}

function render() {
    // controls.update(clock.getDelta())
    labelRenderer.render(scene, camera)
    renderer.render(scene, camera)
}
init()
intializeDemo_()
registerKeyWrapper()
document.addEventListener('keydown', keyPressWrapper)
document.addEventListener('keyup', keyReleaseWrapper)
window.requestAnimationFrame(animate)
