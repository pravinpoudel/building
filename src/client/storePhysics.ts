import * as CANNON from 'cannon-es'
import { text } from 'stream/consumers'
import { FileLoader } from 'three'
import { world } from './client'

interface physicsStateType {
    shape: string
    radius: number | null
    halfExtends: CANNON.Vec3 | null
    position: CANNON.Vec3
    mass: number
}

let worldState: Array<physicsStateType> = []

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

async function getDownloadHandle() {
    const downloadOption = {
        suggestedName: 'physicsState.json',
        types: [
            {
                description: 'Physics state json file',
                accept: {
                    'application/json': ['.json'],
                },
            },
        ],
    }
    // console.log(window)
    const handle = await (window as Window)['showSaveFilePicker'](downloadOption)
    console.log(handle)
    return handle
}

async function saveCustomLocation(handle, data) {
    const writable = await handle.createWritable()
    await writable.write(data)
    await writable.close()
}

async function download() {
    const _data = JSON.stringify(worldState)
    const handle = await getDownloadHandle()
    saveCustomLocation(handle, _data)
    // let filename = 'physicsState.json'
    // var element = document.createElement('a')
    // element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(_data))
    // element.setAttribute('download', filename)
    // element.style.display = 'none'
    // document.body.appendChild(element)
    // element.click()
}

let stateHash = {
    SPHERE: (halfExtends, radius) => {
        return new CANNON.Sphere(radius)
    },
    BOX: (halfExtends, radius) => {
        return new CANNON.Box(new CANNON.Vec3(halfExtends.x, halfExtends.y, halfExtends.z))
    },
}

function readPhysicsState(data: string) {
    let result = JSON.parse(data as string)
    worldState = result
    let _halfExtends, _radius
    for (let i = 0, _length = result.length; i < _length; i++) {
        _halfExtends = result[i].halfExtends
        _radius = result[i].radius
        let shape = stateHash[result[i].shape](_halfExtends, _radius)
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
            // let result = JSON.parse(event.target?.result as string)
            await readPhysicsState(event.target?.result as string)
        }
        reader.readAsText(stateFile)
    }
}

export { updatePhysicsElement, addPhysicsElement, readPhysicsState, worldState }
