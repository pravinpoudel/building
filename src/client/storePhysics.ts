import * as CANNON from 'cannon-es'
import { world } from './client'

interface physicsStateType {
    shape: string
    radius: number | null
    halfExtends: CANNON.Vec3 | null
    position: CANNON.Vec3
    mass: number
}

const worldState: Array<physicsStateType> = []

function addPhysicsElement(shape, params, position, mass) {
    worldState.push({
        shape: shape,
        radius: shape == 'SPHERE' ? params.radius : null,
        halfExtends:
            shape == 'BOX'
                ? new CANNON.Vec3(params.halfExtends.x, params.halfExtends.y, params.halfExtends.z)
                : null,
        position: position,
        mass: mass,
    })
    console.log(worldState)
}

function updatePhysicsElement(index, shape, params, position) {
    console.log(worldState[index - 1])
    console.log(params)
    scalePhysicsElement(index - 1, shape, params)
    movePhysicsElement(index - 1, position)
    console.log(worldState[index - 1])
}

function scalePhysicsElement(index, shape, params) {
    let myBody = worldState[index]
    if (shape == 'SPHERE') {
        myBody.radius = params.radius
    }
    if (shape == 'BOX') {
        myBody.halfExtends = new CANNON.Vec3(
            params.halfExtends.x,
            params.halfExtends.y,
            params.halfExtends.z
        )
    }
}

function movePhysicsElement(index, position) {
    let myBody = worldState[index]

    myBody.position.x = position.x
    myBody.position.y = position.y
    myBody.position.z = position.z
}

function download() {
    const _data = JSON.stringify(worldState)
    let filename = 'physicsState.json'
    var element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(_data))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
}

let stateHash = {
    SPHERE: (radius) => {
        return new CANNON.Sphere(radius)
    },
    BOX: (x, y, z) => {
        return new CANNON.Box(new CANNON.Vec3(x, y, z))
    },
}

function readPhysicsState(result: Array<any>) {
    for (let i = 0, _length = result.length; i < _length; i++) {
        let shape = stateHash[result[i].shape](
            result[i].halfExtends.x,
            result[i].halfExtends.y,
            result[i].halfExtends.z
        )
        let itemsBody = new CANNON.Body({
            mass: 0,
            shape: shape,
        })
        itemsBody.position.copy(
            new CANNON.Vec3(result[i].position.x, result[i].position.y, result[i].position.z)
        )
        world.addBody(itemsBody)
    }
}

document.getElementById('stateDownload')?.addEventListener('click', download)
let inputElement: HTMLInputElement = document.getElementById('physicsInput') as HTMLInputElement
inputElement.oninput = () => {
    if (inputElement.files![0]) {
        let stateFile = inputElement.files![0]
        let reader = new FileReader()
        reader.onload = async function (event) {
            let result = JSON.parse(event.target?.result as string)
            await readPhysicsState(result)
        }
        reader.readAsText(stateFile)
    }
}

export { updatePhysicsElement, addPhysicsElement }
