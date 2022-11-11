import * as THREE from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { Raycaster } from 'three'
import {
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
} from './client'

import * as CANNON from 'cannon-es'
import { ConvexPolyhedron, Cylinder, Heightfield, Material, Plane, Sphere } from 'cannon-es'
let control1
let isPlaying = false
const mouse = new THREE.Vector2()
let originalScaleReference
let selectedMesh
let enableSelection = false
let physicsObjects: Array<THREE.Mesh> = []
let dragControls

function addLight(scene: THREE.Scene) {
    const dirLight_right_near = new THREE.DirectionalLight(new THREE.Color(0xffff))
    dirLight_right_near.position.set(5, 80, 10)
    scene.add(dirLight_right_near)

    const dirLight_left_far = new THREE.DirectionalLight(new THREE.Color(0xffff))
    dirLight_left_far.position.set(50, 80, -10)
    scene.add(dirLight_left_far)

    const ambientLight = new THREE.AmbientLight(0xffffff)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.color.setHSL(0.1, 1, 0.95)
    dirLight.position.set(600, 500, 50)
    dirLight.position.multiplyScalar(1)
    scene.add(dirLight)

    dirLight.castShadow = true

    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048

    const d = 50

    dirLight.shadow.camera.left = -d
    dirLight.shadow.camera.right = d
    dirLight.shadow.camera.top = d
    dirLight.shadow.camera.bottom = -d

    dirLight.shadow.camera.far = 3500
    dirLight.shadow.bias = -0.0001

    // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10)
    scene.add(dirLight)

    return scene
}

function addCamera() {
    const camera = new THREE.PerspectiveCamera(
        90,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(50, 100, 50)
    camera.lookAt(0, 1, 15)
    return camera
}

function addAnnotationSprite() {
    let _texture = new THREE.TextureLoader().load('textures/circle_texture.png')
    const material = new THREE.SpriteMaterial({
        map: _texture,
    })
    let _texture_sprite = new THREE.Sprite(material)
    return _texture_sprite
}

let isPlay = false

let audio = new Audio('/audio/jazz.mp3')
audio.volume = 0.1
document.getElementById('music')?.addEventListener('click', (event) => {
    event?.preventDefault()
    if (!isPlay) {
        audio.play()
        isPlay = true
        ;(document.getElementById('stopIcon') as any).style.display = 'none'
        ;(document.getElementById('playIcon') as any).style.display = 'block'
        if ('dance' in animationListObject) {
            animationListObject['dance']()
        }
    } else {
        audio.pause()
        isPlay = false
        audio.currentTime = 0
        ;(document.getElementById('stopIcon') as any).style.display = 'block'
        ;(document.getElementById('playIcon') as any).style.display = 'none'
        if ('salute' in animationListObject) {
            animationListObject['salute']()
        }
    }
})

const shapeList = {
    4: (halfExtents) => {
        return new CANNON.Box(halfExtents)
    },
    // 8: COMPOUND,
    // 16: ConvexPolyhedron,
    // 128: Cylinder,
    // 32: Heightfield,
    // 64: PARTICLE,
    // 2: Plane,
    1: (radius) => {
        return new CANNON.Sphere(radius)
    },
    // 256: TRIMESH,
}

function editPhysicsBody() {
    output.innerHTML = slider.value
    let scaleFactor = +slider.value as number
    if (selectedMesh) {
        let selectionBodyIndex = selectedMesh.userData.index
        let previousElement = world.bodies[selectionBodyIndex]
        // create new element
        let newRadius = scaleFactor * originalScaleReference
        // let _shape = shapeList[previousElement.shapes[0].type](newRadius)
        // let newBody = new CANNON.Body({
        //     mass: 0,
        //     shape: _shape,
        // })
        // newBody.position.copy(new CANNON.Vec3())
        // world.bodies[selectionBodyIndex] = newBody
        console.log()
        previousElement.shapes[0].radius = newRadius
        previousElement.shapes[0].boundingSphereRadiusNeedsUpdate = true
        // console.log(newBody)
        // update new into old one

        // world.bodies[selectionBodyIndex] =
        console.log(newRadius)
    }
}

function movePhysicsBody() {
    if (selectedMesh) {
        let selectionBodyIndex = selectedMesh.userData.index
        let movingBody = world.bodies[selectionBodyIndex]
        movingBody.position.x = selectedMesh.position.x
        movingBody.position.y = selectedMesh.position.y
        movingBody.position.z = selectedMesh.position.z
        console.log(movingBody.position)
    }
}

function createPhysicsBody(e: MouseEvent) {
    event?.preventDefault()
    let mouse_position = new THREE.Vector2()
    mouse_position.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1
    mouse_position.y = -(e.clientY / renderer.domElement.clientHeight) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const intersections = raycaster.intersectObjects(sceneObjects, true)
    let intersection = intersections.length > 0 ? intersections[0] : null
    if (intersection !== null) {
        console.log(world.bodies)
        const intersect3D = intersection.object
        console.log(intersect3D.userData.index)
        if (intersect3D.userData.index >= 0) {
            console.log(world.bodies[intersect3D.userData.index])
            selectedMesh = intersect3D
            physicsObjects = [selectedMesh]
            initDragController()
            let selectionBodyIndex = selectedMesh.userData.index
            let previousElement = world.bodies[selectionBodyIndex]
            originalScaleReference = previousElement.shapes[0].radius
            ;((intersect3D as any).material as any).color = new THREE.Color(0xff0000)
        } else {
            let point = intersection.point
            let itemsBody = new CANNON.Body({
                mass: 0,
                shape: new CANNON.Sphere(5),
            })
            let itemsBodycopy = Object.assign(itemsBody, { name: 'chair' })
            console.log(itemsBodycopy)
            itemsBodycopy.position.copy(new CANNON.Vec3(point.x, point.y, point.z))
            world.addBody(itemsBodycopy)
        }
    }
}

function dragPhysicsObject() {
    // event.preventDefault()
    if (enableSelection) {
        const draggableObjects = dragControls.getObjects()
        draggableObjects.length = 0
        dragControls.transformGroup = true
        draggableObjects.push(selectedMesh)
        movePhysicsBody()
        render(clock.getDelta())
    }
}

function onKeyDown(event) {
    console.log(event.keyCode)
    if (event.keyCode === 16) {
        enableSelection = true
    } else if (event.keyCode == 71 && selectedMesh != undefined) {
        selectedMesh.material.wireframe = true
    } else if (event.keyCode == 72 && selectedMesh != undefined) {
        selectedMesh.material.wireframe = false
    } else {
        console.log(' you are awesome')
    }
}

function onKeyUp(event) {
    if (event.keyCode === 16) enableSelection = false
    if (event.keyCode == 17) {
        console.log('ctrl pressed')
        if (selectedMesh) {
            let mesh1 = selectedMesh
            mesh1.material.wireframe = true
            mesh1.material.color = new THREE.Color(0x00ff00)
            selectedMesh = undefined
        }
    }
}

// function onClick(event) {
//     event.preventDefault()

//     if (enableSelection === true) {
//         const draggableObjects = control1.getObjects()
//         draggableObjects.length = 0

//         mouse.x = (event.clientX / window.innerWidth) * 2 - 1
//         mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

//         raycaster.setFromCamera(mouse, camera)

//         const intersections = raycaster.intersectObjects(selectedMesh, true)

//         if (intersections.length > 0) {
//             const object = intersections[0].object

//             if (group.children.includes(object) === true) {
//                 object.material.emissive.set(0x000000)
//                 scene.attach(object)
//             } else {
//                 object.material.emissive.set(0xaaaaaa)
//                 group.attach(object)
//             }

//             controls.transformGroup = true
//             draggableObjects.push(group)
//         }

//         if (group.children.length === 0) {
//             controls.transformGroup = false
//             draggableObjects.push(...objects)
//         }
//     }

//     render()
// }

function initDragController() {
    dragControls = new DragControls(physicsObjects, camera, renderer.domElement)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    dragControls.addEventListener('dragstart', function () {
        controls.disconnect()
    })
    dragControls.addEventListener('drag', dragPhysicsObject)
    dragControls.addEventListener('dragend', function () {
        controls.connect()
    })
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    // render()
}

var slider = document.getElementById('myRange') as HTMLInputElement
var output = document.getElementById('scaleDisplay') as HTMLSpanElement
output.innerHTML = slider.value

slider.oninput = function () {
    editPhysicsBody()
}

export {
    addLight,
    addCamera,
    addAnnotationSprite,
    onWindowResize,
    createPhysicsBody,
    dragPhysicsObject,
    initDragController,
}
