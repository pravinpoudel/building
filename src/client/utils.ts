import * as THREE from 'three'

function addLight(scene: THREE.Scene) {
    const dirLight_right_near = new THREE.DirectionalLight(new THREE.Color(0xffff))
    dirLight_right_near.position.set(5, 80, 10)
    scene.add(dirLight_right_near)

    const dirLight_left_far = new THREE.DirectionalLight(new THREE.Color(0xffff))
    dirLight_left_far.position.set(50, 80, -10)
    scene.add(dirLight_left_far)

    const ambientLight = new THREE.DirectionalLight(0xffffff)
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
    camera.position.set(0, 1, 5)
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

export { addLight, addCamera, addAnnotationSprite }
