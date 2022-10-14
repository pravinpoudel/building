import * as THREE from 'three'
import { Vec2 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
// import { TWEEN } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js'
import { addLight, addCamera, addAnnotationSprite } from './utils'
import { annotation } from './house_annotation'

let scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
const labelRenderer = new CSS2DRenderer()
const developerMode = true

let camera: THREE.PerspectiveCamera
let raycaster: THREE.Raycaster
let annotationSprite = new THREE.Sprite()
let sceneObject = new Array()
let pointer: THREE.Vector2 = new THREE.Vector2()
let controls: OrbitControls

function init() {
    scene = addLight(scene)
    camera = addCamera()
    annotationSprite = addAnnotationSprite()
    scene.add(annotationSprite)
    raycaster = new THREE.Raycaster()

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const element = document.createElement('div') as HTMLElement
    labelRenderer.setSize(window.innerWidth, innerHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0px'
    document.body.appendChild(labelRenderer.domElement)

    controls = new OrbitControls(camera, labelRenderer.domElement) // (, html element used for event listener)
    controls.target.set(0.0, 0.0, 0.0)
    document.addEventListener('mousemove', onPointerMove)

    const objLoader = new OBJLoader()
    const gltfLoader = new GLTFLoader()

    gltfLoader.setPath('./models/astronaut/').load('scene.gltf', function (gltf) {
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

function loadAnnotationIntoScene() {
    annotation.forEach((element, index) => {
        for (let [key, value] of Object.entries(element)) {
        }
    })
}

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
    console.log(camera.position)
    if (developerMode) {
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(scene.children, true)
        if (intersects.length > 0) {
            let result = new THREE.Vector3()
            camera.getWorldPosition(result)
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
