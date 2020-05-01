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

// Hook into DOM
let users = document.querySelector('.users'),
    shapeSelect = document.querySelector('#shapeSelect'),
    colorSelect = document.querySelector('#colorSelect'),
    depthSelect = document.querySelector('#depthSelect'),
    tokenSubmit = document.querySelector('#tokenSubmit'),
    mapToggle = document.querySelector('#mapToggle');

tokenSubmit.onclick = function (event) {
    const scene = game.scene.scenes[0];
    let shape = UI.createToken.shape.value;
    let color = UI.colors[UI.createToken.color.value];
    let depth = UI.createToken.depth.value;
    generateToken(scene, null, null, shape, color, depth);
}

const config = {
    parent: 'phaser-container',
    type: Phaser.AUTO,
    width: canvasSize,
    height: canvasSize,
    backgroundColor: canvasColor,
    scene: [
        GameboardScene,
        HudScene,
    ],
    callbacks: {
        postBoot: function(game) {
            let address = "ws://127.0.0.1:6789/" + tabletop_identifier;
            game.sync = new SyncClient(game, address);
        },
    },
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
    let properties = {x: x, y: y, shape: shape, color: color, depth: depth}
    game.sync.update(name, properties);
    token.on('drag', function (pointer, dragX, dragY) {
        // Instead of dragX and we use the pointer's world position. Although it causes the token to "center" where the drag started,
        // it plays well with different zooms and dragging objects while scrolling.
        let newX = wasd.ctrl.isDown ? token.input.dragStartX : pointer.worldX;
        let newY = wasd.ctrl.isDown ? token.input.dragStartY : pointer.worldY;

        if (token.x != newX || token.y != newY) {

            // Update token on board and server
            token.x = newX;
            token.y = newY;
            let properties = {x: newX, y: newY, shape: shape, color: color, depth: depth}
            game.sync.update(name, properties);
        }
    });
}
