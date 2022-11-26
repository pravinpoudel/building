import * as CANNON from 'cannon-es'

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

document.getElementById('stateDownload')?.addEventListener('click', download)

export { updatePhysicsElement, addPhysicsElement }
