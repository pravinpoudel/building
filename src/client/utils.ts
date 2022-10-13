import * as THREE from 'three'

function addLight(scene: THREE.Scene) {
    const dirLight_right_near = new THREE.DirectionalLight()
    dirLight_right_near.position.set(30, 80, 40)
    scene.add(dirLight_right_near)

    const dirLight_left_far = new THREE.DirectionalLight()
    dirLight_left_far.position.set(-30, 80, -40)
    scene.add(dirLight_left_far)

    return scene
}

function addCamera() {
    const camera = new THREE.PerspectiveCamera(
        90,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(24, 19, 9)
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

export { addLight, addCamera, addAnnotationSprite }
