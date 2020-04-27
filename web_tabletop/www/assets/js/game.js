// Set some config type stuff
let websocket, cursors, wasd;

const canvasSize = 900;
const canvasColor = 0x343a40;
const gridSquareSize = 64;
const gridSquareCount = 24;
const gridColor = 0x6c757d;
const gridAlpha = 0.5;
const gridLineColor = 0x0;
const gridLineAlpha = 1;
const gridAltColor = 0x343a40;
const gridAltAlpha = 0.4;
const gridSize = gridSquareSize * gridSquareCount;
const fieldSize = gridSize + 256;
const tokenSize = gridSquareSize - 7;

const colors = {
    "blue": 0x007bff,
    "purple": 0x6f42c1,
    "pink": 0xe83e8c,
    "red": 0xdc3545,
    "orange": 0xfd7e14,
    "yellow": 0xffc107,
    "green": 0x28a745,
    "white": 0xffffff,
    "black": 0x000000,
};

// Hook into DOM
let minus = document.querySelector('.minus'),
    plus = document.querySelector('.plus'),
    value = document.querySelector('.value'),
    users = document.querySelector('.users'),
    shapeSelect = document.querySelector('#shapeSelect'),
    colorSelect = document.querySelector('#colorSelect'),
    depthSelect = document.querySelector('#depthSelect'),
    tokenSubmit = document.querySelector('#tokenSubmit'),
    mapToggle = document.querySelector('#mapToggle');

tokenSubmit.onclick = function (event) {
    const scene = game.scene.scenes[0];
    let shape = shapeSelect.value;
    let color = colors[colorSelect.value];
    let depth = depthSelect.value;
    generateToken(scene, null, null, shape, color, depth);
}

var GameboardScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize:
    function GameboardScene() {
        Phaser.Scene.call(this, { key: 'gameboard' });
    },

    preload: function () {
        this.load.image('virus', '/assets/img/virus.png');
        this.load.image('map', '/assets/img/map.jpg');
    },

    create: function () {
        // Load the websocket stuff here so images are loaded
        websocket = new WebSocket("ws://127.0.0.1:6789/");

        // Setup some input
        cursors = this.input.keyboard.createCursorKeys();
        wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
        });

        this.cameras.main.setBounds(0, 0, fieldSize, fieldSize);
        this.cameras.main.zoom = 0.5;

        minus.onclick = function (event) {
            websocket.send(JSON.stringify({action: 'minus'}));
        }

        plus.onclick = function (event) {
            websocket.send(JSON.stringify({action: 'plus'}));
        }

        mapToggle.onclick = function (event) {
            testMap.setAlpha(testMap.alpha == 1 ? 0 : 1);
        }

        websocket.onmessage = function (event) {
            data = JSON.parse(event.data);
            switch (data.type) {
                case 'state':
                    if (data.value != null) {
                        value.textContent = data.value;
                    }

                    const scene = game.scene.scenes[0];
                    if (!scene) {
                        break;
                    }

                    let re = RegExp('^token\d*');
                    let tokenNames = Object.keys(data).filter((k) => re.test(k));
                    tokenNames.forEach((name) => {
                        const token = scene.children.getByName(name);
                        if (token) {
                            token.x = data[name].x;
                            token.y = data[name].y;
                        }
                        else {
                            generateToken(scene, data[name].x, data[name].y, data[name].shape, data[name].color, data[name].depth, name)
                        }
                    });

                    break;
                case 'users':
                    users.textContent = (data.count.toString() + " user" + (data.count == 1 ? "" : "s"));
                    break;
                default:
                    console.error("unsupported event", data);
            }
        };

        // Create the gameboard
        const grid = this.add.grid(fieldSize/2, fieldSize/2, gridSize, gridSize, gridSquareSize, gridSquareSize, gridColor, gridAlpha, gridLineColor, gridLineAlpha)
            .setAltFillStyle(gridAltColor, gridAltAlpha);
        grid.name = 'gameboard';
        grid.depth = 1;

        // test map
        const testMap = this.add.image(fieldSize/2, fieldSize/2, 'map');
        testMap.depth = -1;

        // Request token information
        let wsState = websocket.readyState;
        if (wsState == websocket.OPEN) {
            websocket.send(JSON.stringify({action: 'ping'}))
        }
        else {
            websocket.onopen = () => {websocket.send(JSON.stringify({action: 'ping'}))};
        }

        this.scene.launch('hud');
    },

    update: function () {
        let cam = this.cameras.main;
        let speed = cursors.shift.isDown ? 16 : 8;

        if (Phaser.Input.Keyboard.JustDown(cursors.space))
        {
            let newZoom = cam.zoom == 1 ? 0.5 : 1;
            cam.zoomTo(newZoom);
        }

        if (cursors.left.isDown || wasd.left.isDown)
        {
            cam.scrollX -= speed;
        }
        else if (cursors.right.isDown || wasd.right.isDown)
        {
            cam.scrollX += speed;
        }

        if (cursors.up.isDown || wasd.up.isDown)
        {
            cam.scrollY -= speed;
        }
        else if (cursors.down.isDown || wasd.down.isDown)
        {
            cam.scrollY += speed;
        }
    },
});

let config = {
    parent: 'phaser-container',
    type: Phaser.AUTO,
    width: canvasSize,
    height: canvasSize,
    backgroundColor: canvasColor,
    scene: [
        GameboardScene,
        HudScene,
    ],
};

const game = new Phaser.Game(config);

let tokenCounter = 0;   // TODO:  make better

function generateToken(scene, x, y, shape, color, depth=2, name=null)
{
    // Create new token based on shape
    let token = null;

    switch (shape) {
        case 'circle':
            x = x || 32;
            y = y || 32;
            token = scene.add.ellipse(x, y, tokenSize, tokenSize, color, 1);
            break;
        case 'triangle':
            x = x || 32;
            y = y || 96;
            token = scene.add.triangle(x, y, 0, tokenSize, tokenSize/2, 0, tokenSize, tokenSize, color);
            break;
        case 'horizrectangle':
            x = x || 32;
            y = y || 160;
            token = scene.add.rectangle(x, y, tokenSize, tokenSize/2, color);
            break;
        case 'vertrectangle':
            x = x || 32;
            y = y || 224;
            token = scene.add.rectangle(x, y, tokenSize/2, tokenSize, color);
            break;
        case 'star':
            x = x || 32;
            y = y || 288;
            token = scene.add.star(x, y, 5, tokenSize/4, tokenSize/2, color);
            break;
        case 'virus':
            x = x || 96;
            y = y || 32;
            token = scene.add.image(x, y, 'virus');
    }

    // Set outline color for simple shape tokens
    if (token.setStrokeStyle) {
        token.setStrokeStyle(1, gridAltColor, 1);
    }

    // If no name provided, generate an unused name
    while (!name) {
        let potential = 'token' + tokenCounter++;
        let existing = scene.children.getByName(potential);
        if (!existing) {
            name = potential;
        }
    }
    token.name = name;
    token.depth = depth;

    // Add ability to drag and update server with position
    token.setInteractive();
    scene.input.setDraggable(token);
    websocket.send(JSON.stringify({action: 'move', token: name, target: {x: x, y: y, shape: shape, color: color, depth: depth}}));
    token.on('drag', function (pointer, dragX, dragY) {
        // Instead of dragX and we use the pointer's world position. Although it causes the token to "center" where the drag started,
        // it plays well with different zooms and dragging objects while scrolling.
        let newX = wasd.ctrl.isDown ? token.input.dragStartX : pointer.worldX;
        let newY = wasd.ctrl.isDown ? token.input.dragStartY : pointer.worldY;

        if (token.x != newX || token.y != newY) {

            // Update token on board and server
            token.x = newX;
            token.y = newY;
            websocket.send(JSON.stringify({action: 'move', token: token.name, target: {x: newX, y: newY, shape: shape, color: color, depth: depth}}));
        }
    });
}
