import * as THREE from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
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
    scene,
    orbitControls,
} from './client'

import * as CANNON from 'cannon-es'
import { ConvexPolyhedron, Cylinder, Heightfield, Material, Plane, Sphere } from 'cannon-es'
import * as TWEEN from '@tweenjs/tween.js'

let control1
let isPlaying = false
const mouse = new THREE.Vector2()
let originalScaleReference
let originalSizeReferenceBox
let selectedMesh
let enableSelection = false
let physicsObjects: Array<THREE.Mesh> = []
let dragControls
let shape: any = new CANNON.Box(new CANNON.Vec3(5, 5, 5))
let myShape = 'BOX'
let defaultSize = 10
let defaultRadius = 5
let transformControl
let canTransform = false
let isSphere = false
let isBox = true

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
    // camera.position.set(50, 100, 50)
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
    let value = Math.max(+slider.value / 200, 0.2)
    output.innerHTML = '' + value
    let scaleFactor = value
    if (selectedMesh) {
        let selectionBodyIndex = selectedMesh.userData.index
        let previousElement = world.bodies[selectionBodyIndex]
        // create new element
        let newRadius = scaleFactor * originalScaleReference
        let xScale = newRadius
        let yScale = newRadius
        let zScale = newRadius

        if (myShape == 'BOX') {
            xScale = originalSizeReferenceBox.x * value
            yScale = originalSizeReferenceBox.y * value
            zScale = originalSizeReferenceBox.z * value
        }
        let newBody = scalePhysicsBody(previousElement, xScale, yScale, zScale)
    }
}

function scalePhysicsBody(movingBody, x, y, z) {
    let currentShape = movingBody.shapes[0]
    // movingBody.removeShape(currentShape)
    if (myShape == 'SPHERE') {
        let newradius = Math.max(x, y, z)
        currentShape.radius = newradius
        currentShape.updateBoundingSphereRadius()
        movingBody.updateBoundingRadius()
    } else if (myShape == 'BOX') {
        currentShape.halfExtents.set(Math.abs(x / 2), Math.abs(y / 2), Math.abs(z / 2))
        currentShape.updateConvexPolyhedronRepresentation()
        movingBody.updateBoundingRadius()
    }
}

function movePhysicsBody() {
    if (selectedMesh) {
        let selectionBodyIndex = selectedMesh.userData.index
        let movingBody = world.bodies[selectionBodyIndex]
        // copy tranalation
        movingBody.position.x = selectedMesh.position.x
        movingBody.position.y = selectedMesh.position.y
        movingBody.position.z = selectedMesh.position.z
        // copy rotation
        movingBody.quaternion.copy(selectedMesh.quaternion)
        // copy scaling
        // console.log('scale is ', selectedMesh.scale)
        movingBody = scalePhysicsBody(
            movingBody,
            selectedMesh.scale.x,
            selectedMesh.scale.y,
            selectedMesh.scale.z
        )
        // movingBody.scale.copy(selectedMesh.scale)
        // console.log(movingBody)
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
            if (transformControl != null) {
                transformControl.detach()
            }
            transformControl = new TransformControls(camera, renderer.domElement)
            transformControl.space = 'local'

            transformControl.addEventListener('change', () => {
                movePhysicsBody()
            })
            ;(document.getElementsByClassName('slidecontainer')[0] as HTMLElement).style.display =
                'block'
            window.addEventListener('mousemove', onMouseMove, false)
            window.addEventListener('keydown', onKeyDown)
            window.addEventListener('keyup', onKeyUp)

            transformControl.addEventListener('dragging-changed', function (event) {
                orbitControls.enabled = !event.value
                console.log(' can you transform ?: Answer is ', canTransform)
            })

            transformControl.attach(selectedMesh)
            // console.log('the axis is', transformControl.axis)
            // transformControl.space = 'local'
            orbitControls.enabled = true
            // get it by tween
            new TWEEN.Tween(orbitControls.target)
                .to(
                    {
                        x: selectedMesh.position.x,
                        y: selectedMesh.position.y,
                        z: selectedMesh.position.z,
                    },
                    2000
                )
                .easing(TWEEN.Easing.Cubic.Out)
                .start()
                .onUpdate(() => {
                    // controls.getObject().lookAt(params.lookAt.x, params.lookAt.z, params.lookAt.z)
                    controls.getObject().updateProjectionMatrix()
                })
            controls.disconnect()
            // dragControls.deactive()
            scene.add(transformControl)
            // initDragController()
            let selectionBodyIndex = selectedMesh.userData.index
            let previousElement = world.bodies[selectionBodyIndex]
            if (myShape == 'SPHERE') {
                originalScaleReference = previousElement.shapes[0].radius
            }

            if (myShape == 'BOX') {
                originalSizeReferenceBox = {
                    x: previousElement.shapes[0].halfExtents.x,
                    y: previousElement.shapes[0].halfExtents.y,
                    z: previousElement.shapes[0].halfExtents.z,
                }
                console.log('original size is', originalSizeReferenceBox)
            }
            let material1 = selectedMesh.material
            material1.color = new THREE.Color(0xffd300)
            selectedMesh.material = material1
        } else {
            let point = intersection.point
            if (selectedMesh != undefined) {
                ;((selectedMesh as any).material as any).color = new THREE.Color(0x00ff00)
            }
            if (transformControl != undefined) {
                transformControl.detach()
            }
            selectedMesh = undefined
            let shape1
            if (isBox) {
                shape1 = new CANNON.Box(new CANNON.Vec3(5, 5, 5))
            }

            if (isSphere) {
                shape1 = new CANNON.Sphere(10)
            }

            let itemsBody = new CANNON.Body({
                mass: 1,
                shape: shape1,
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
    let code = event.keyCode
    if (selectedMesh == undefined) {
        return
    }
    if (code === 'Escape') {
        orbitControls.enabled = false
        controls.connect()
    } else if (code === 16) {
        transformControl.setMode('translate')
    } else if (code == 71) {
        selectedMesh.material.wireframe = true
    } else if (code == 74) {
        console.log('rotation selected')
        transformControl.setMode('rotate')
    } else if (code == 72) {
        console.log('translation selected')
        transformControl.setMode('translate')
    } else if (code == 75) {
        console.log('scale selected')
        transformControl.setMode('scale')
    } else if (code == 187 || code == 107) {
        transformControl.setSize(transformControl.size + 0.1)
    } else if (code == 189 || code == 109) {
        transformControl.setSize(Math.max(transformControl.size - 0.1, 0.1))
    } else if (code == 88) {
        transformControl.showX = !transformControl.showX
    } else if (code == 89) {
        transformControl.showY = !transformControl.showY
    } else if (code == 90) {
        transformControl.showZ = !transformControl.showZ
    } else if (code == 27) {
        transformControl.reset()
    }
}

function onKeyUp(event) {
    if (event.keyCode === 16) {
        enableSelection = false
        transformControl.setTranslationSnap(null)
    }
    if (event.keyCode == 17) {
        console.log('ctrl pressed')
        if (selectedMesh) {
            let mesh1 = selectedMesh
            mesh1.material.wireframe = true
            mesh1.material.color = new THREE.Color(0x22ff22)
            selectedMesh = undefined
            transformControl.detach()
        }
        transformControl.setTranslationSnap(null)
        transformControl.setRotationSnap(null)
        transformControl.setScaleSnap(null)
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

function onMouseMove(event) {
    var mouse = new THREE.Vector2()
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    var raycaster = new THREE.Raycaster()
    var intersects = new THREE.Vector3()
    if (enableSelection) {
        var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
        scene.add(new THREE.PlaneHelper(plane, 100000, 0xffff00))
        raycaster.setFromCamera(mouse, camera)
        raycaster.ray.intersectPlane(plane, intersects)
        console.log(enableSelection)
        console.log(intersects)
        selectedMesh.position.set(intersects.x, intersects.y, intersects.z)
        movePhysicsBody()
    }
}

function initDragController() {
    dragControls = new DragControls(physicsObjects, camera, renderer.domElement)
    dragControls.addEventListener('dragstart', function () {
        // controls.disconnect()
    })
    dragControls.addEventListener('drag', dragPhysicsObject)
    dragControls.addEventListener('dragend', function () {
        controls.connect()
    })
}

// const shapeHash = {
//     SPHERE: (scale) => {
//         if (scale == undefined || scale <= 0) {
//             scale = defaultRadius
//         }
//         return new CANNON.Sphere(scale)
//     },
//     BOX: (scale) => {
//         if (scale == undefined || scale <= 0) {
//             scale = defaultSize
//         }
//         console.log('the box size is ', scale, scale, scale)
//         return new CANNON.Box(new CANNON.Vec3(scale / 2, scale / 2, scale / 2))
//     },
// }

function addElementHandler(event) {
    event.preventDefault()
    myShape = event.target.dataset.id
    myShape = myShape.toUpperCase()
    if (myShape == 'BOX') {
        isBox = true
        isSphere = false
    }

    if (myShape == 'SPHERE') {
        isSphere = true
        isBox = false
    }
    // shape = shapeHash[myShape](10)
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
console.log(slider.value)
output.innerHTML = '' + +slider.value / 200

let addElement = document.getElementsByClassName('make-mesh-div')[0]
addElement.addEventListener('click', addElementHandler)

slider.oninput = function () {
    editPhysicsBody()
}

async function comrpessImage(url) {
    // const fileLoaded = await fs.readFile(
    //     './models/drawing_room/textures/model_Material_u1_v1_baseColor.jpeg'
    // )
    // const image = imagePool.ingestImage(fileLoaded)
    // await image.preprocess(encodeOptions)
    // const rawEncodedImage = image.encodedWith.mozjpeg.binary
    // fs.writeFile('./models/drawing_room/textures//compressed_image.jpg', rawEncodedImage)
}

// comrpessImage('hello')

export {
    addLight,
    addCamera,
    addAnnotationSprite,
    onWindowResize,
    createPhysicsBody,
    dragPhysicsObject,
    initDragController,
    world,
}
