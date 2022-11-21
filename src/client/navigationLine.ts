import { create } from 'domain'
import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Line,
    LineBasicMaterial,
    Vector3,
} from 'three'
import { addLight } from './utils'

const lineSegments = 15
const lineGeometry = new BufferGeometry()
const lineGeometryVertices = new Float32Array((lineSegments + 1) * 3)
lineGeometryVertices.fill(0)
lineGeometry.setAttribute('position', new BufferAttribute(lineGeometryVertices, 3))
let lineMaterial = new LineBasicMaterial({
    color: 0x555555,
    linewidth: 5,
    blending: AdditiveBlending,
})
const guideLine = new Line(lineGeometry, lineMaterial)

function getPosition(positionVec, t, p0, velocity, gravity) {
    positionVec.copy(p0)
    positionVec.addScaledVector(velocity, t) //remember it should be vector, float [order matters]
    positionVec.addScaledVector(new Vector3(0, gravity, 0), 0.5 * Math.pow(t, 2))
    return positionVec
}

function findTotalTime(p0y, velocity, gravity) {
    let solution =
        (-1 * velocity.y + Math.sqrt(Math.pow(velocity.y, 2) - 2 * gravity * p0y)) / gravity
    return solution
}

function createRay(controller) {
    //  this is in ray-target space so first point is origin itself
    let startVertex = new Vector3(0, 0, 0)
    let startingPositionWorld = new Vector3()
    let rayDirectionWorld = new Vector3()
    controller.getWorldPosition(startingPositionWorld)
    controller.getWorldDirection(rayDirectionWorld)
    rayDirectionWorld = rayDirectionWorld.multiplyScalar(6)
    let totalTime = findTotalTime(startingPositionWorld.y, rayDirectionWorld, -9.8)
    for (let i = 1; i < 11; i++) {
        let timeStamp = (i * totalTime) / lineSegments
        let localPosition = new Vector3()
        localPosition = getPosition(
            localPosition,
            timeStamp,
            startingPositionWorld,
            rayDirectionWorld,
            -9.8
        )
        // remember that this localposition is in world cordinate system so need to convert to world
        controller.worldToLocal(localPosition)
        localPosition.toArray(lineGeometryVertices, i * 3)
    }
    guideLine.geometry.attributes.position.needsUpdate = true
    console.log(guideLine)
    controller.add(guideLine)
    addSprite()
    addLightRay()
}

function addSprite() {}

function addLightRay() {}

function removeRay(controller) {
    controller.remove(guideLine)
}

export { createRay, removeRay, addLightRay, addSprite }
