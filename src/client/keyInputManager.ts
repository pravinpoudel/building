function escapeController(event, menuBoard) {
    if (event.key === 'Escape') {
        console.log('hi')
        menuBoard.style.display = 'block'
    }
}

function startHandlerFPS(controls, startElement, menuBoard, speedInputElement) {
    menuBoard.style.display = 'none'
    startElement.addEventListener('click', () => {
        menuBoard.style.display = 'none'
    })
    // document.addEventListener('keydown', function (event) {
    //     escapeController(event, menuBoard)
    // })
    controls.lock()
    let playerSpeed = Number(speedInputElement.value)
    return playerSpeed
}

function keyPress(event, keys) {
    let pressedKey = event.key
    let lowercasedKey = pressedKey.toLowerCase()
    keys[lowercasedKey] = true
    return keys
}

function keyRelease(event, deletedKeys, keys) {
    let pressedKey = event.key
    let lowercasedKey = pressedKey.toLowerCase()
    deletedKeys[lowercasedKey] = true
    delete keys[lowercasedKey]
    return [deletedKeys, keys]
}

function register(handlers, key, handler, releaser) {
    handlers[key] = handler
    releaser[key] = releaser
    return handlers
}

function ClearKey() {
    let handlers = {}
    let keys = {}
    let deletedKeys = {}
    return [handlers, keys, deletedKeys]
}

function registerKey(controls, handlers, keys, playerSpeed) {
    console.log(controls)
    let forward = 'w'
    let left = 'a'
    let reverse = 's'
    let right = 'd'
    let lock = 'l'
    let unlock = 'p'
    let down = 'arrowdown'
    let up = 'arrowup'

    console.log(playerSpeed)
    handlers = register(
        handlers,
        forward,
        function (elapsedTime) {
            console.log('moveForward')
            let cameraWorldPositionX = controls.getObject().position.x
            // if (cameraWorldPositionX > (-1 * terrainDimension.x) / 2.0)
            controls.moveForward(playerSpeed * elapsedTime * 0.01)
        },
        function () {}
    )

    handlers = register(
        handlers,
        reverse,
        function (elapsedTime) {
            let cameraWorldPositionX = controls.getObject().position.x
            console.log('moveReverse')
            controls.moveForward(-1 * playerSpeed * elapsedTime * 0.01)
        },
        () => {}
    )

    handlers = register(
        handlers,
        left,
        function (elapsedTime) {
            let cameraWorldPositionZ = controls.getObject().position.Z
            console.log('moveLeft')
            controls.moveRight(-1 * playerSpeed * elapsedTime * 0.01)
        },

        function (elapsedTime) {}
    )

    handlers = register(
        handlers,
        right,
        function (elapsedTime) {
            let cameraWorldPositionZ = controls.getObject().position.Z
            console.log('moveRight')
            controls.moveRight(playerSpeed * elapsedTime * 0.01)
        },
        function (elapsedTime) {}
    )

    handlers = register(
        handlers,
        lock,
        function (elapsedTime) {
            console.log('lock Mouse Pointer')
            controls.lock()
        },
        function (elapsedTime) {}
    )

    handlers = register(
        handlers,
        unlock,
        function (elapsedTime) {
            console.log('unlock Mouse Pointer')
            controls.unlock()
        },
        function (elapsedTime) {}
    )

    handlers = register(
        handlers,
        up,
        function (elapsedTime) {
            console.log('moving up')
            let cameraWorldPositionY = controls.getObject().position.y
            // if (cameraWorldPositionY < 500) {
            controls.getObject().position.y += playerSpeed * elapsedTime * 0.01
            // }
        },
        function (elapsedTime) {}
    )

    handlers = register(
        handlers,
        down,
        function (elapsedTime) {
            console.log('mocing down')
            let cameraWorldPositionY = controls.getObject().position.y
            console.log(cameraWorldPositionY)
            // if (cameraWorldPositionY > 50.0) {
            controls.getObject().position.y -= playerSpeed * elapsedTime * 0.01
            // }
        },
        function (elapsedTime) {}
    )

    return handlers
}

function keyUpdate(handlers, keys, elapsedTime) {
    for (let key in keys) {
        if (handlers.hasOwnProperty(key)) {
            if (handlers[key]) {
                handlers[key](elapsedTime)
            } else {
                console.warn(`${key} does not have handler registered for it`)
            }
        }
    }
}

export { startHandlerFPS, keyPress, keyRelease, register, ClearKey, registerKey, keyUpdate }
