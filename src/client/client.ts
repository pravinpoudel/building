import * as THREE from 'three'
import { Vec2 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { TWEEN } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js'
import { addLight, addCamera, addAnnotationSprite } from './utils'
import { annotation } from './house_annotation'

import './styles/style.css'

let scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
const labelRenderer = new CSS2DRenderer()
const developerMode = false

let camera: THREE.PerspectiveCamera
let raycaster: THREE.Raycaster
let annotationSprite = new THREE.Sprite()
let sceneObject = new Array()
let pointer: THREE.Vector2 = new THREE.Vector2()
let controls: OrbitControls
let annotationSpriteList: Array<THREE.Sprite> = []

const imageMap = new THREE.TextureLoader().load('textures/circle_texture.png')

function init() {
    scene = addLight(scene)
    scene.background = new THREE.Color(0xffffff)
    camera = addCamera()

    raycaster = new THREE.Raycaster()

    const element = document.createElement('div') as HTMLElement
    labelRenderer.setSize(window.innerWidth, innerHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0px'
    document.body.appendChild(labelRenderer.domElement)

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, labelRenderer.domElement) // (, html element used for event listener)
    controls.target.set(0.0, 100.0, 0.0)
    document.addEventListener('mousemove', onPointerMove)

    const objLoader = new OBJLoader()
    const gltfLoader = new GLTFLoader()

    gltfLoader.setPath('./models/drawing_room/').load('scene.gltf', function (gltf) {
        gltf.scene.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                const _child = child as THREE.Mesh
                _child.castShadow = true
                _child.receiveShadow = true
                _child.scale.set(100, 100, 100)
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

    // new MTLLoader().setPath('models/').load('house_water.mtl', function (materials) {
    //     materials.preload()
    //     objLoader
    //         .setMaterials(materials)
    //         .setPath('models/')
    //         .load('house_water.obj', function (object) {
    //             // object.traverse(function (child) {
    //             //     if (child instanceof THREE.Mesh) {
    //             //         scene.add(child)
    //             //     }
    //             // })
    //             object.scale.set(0.04, 0.04, 0.04)
    //             scene.add(object)
    //             loadAnnotationIntoScene()
    //         })
    // })

    window.addEventListener('resize', onWindowResize)
}

function performAnnotation(event: MouseEvent) {
    console.log(event)
    console.log('hello')
}
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
        myButton.addEventListener('click', performAnnotation, false)
        // make sprite
        console.log(imageMap)

        //
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
        const annotationLabelObject = new CSS2DObject(annotationLableDiv)
        annotationLabelObject.position.set(element.lookAt.x, element.lookAt.y, element.lookAt.z)
        scene.add(annotationLabelObject)
    })
}

loadAnnotationIntoScene()

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

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    if (developerMode) {
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(scene.children, true)
        if (intersects.length > 0) {
            let result = new THREE.Vector3()
            camera.getWorldPosition(result)
            console.log('camera position', result)
            console.log('mouse position', intersects[0].point)
        }
    }
    render()
}

function render() {
    labelRenderer.render(scene, camera)
    renderer.render(scene, camera)
}
init()
animate()
