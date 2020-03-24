const tokenSize = 58;
const colors = {
    "red": 0xff0000,
    "cyan": 0x00ffff,
    "blue": 0x0000ff,
    "darkblue": 0x0000a0,
    "lightblue": 0xadd8e6,
    "purple": 0x800080,
    "yellow": 0xffff00,
    "lime": 0x00ff00,
    "majenta": 0xff00ff,
    // "white": 0xffffff,
    "silver": 0xc0c0c0,
    "gray": 0x808080,
    "black": 0x000000,
    "orange": 0xffa500,
    "brown": 0xa52a2a,
    "maroon": 0x800000,
    "green": 0x008000,
    "olive": 0x808000,
};

let minus = document.querySelector('.minus'),
    plus = document.querySelector('.plus'),
    value = document.querySelector('.value'),
    users = document.querySelector('.users'),
    shapeSelect = document.querySelector('#shapeSelect'),
    colorSelect = document.querySelector('#colorSelect'),
    depthSelect = document.querySelector('#depthSelect'),
    tokenSubmit = document.querySelector('#tokenSubmit'),
    websocket = new WebSocket("ws://192.168.1.19:6789/");
    // websocket = new WebSocket("ws://127.0.0.1:6789/");

minus.onclick = function (event) {
    websocket.send(JSON.stringify({action: 'minus'}));
}

plus.onclick = function (event) {
    websocket.send(JSON.stringify({action: 'plus'}));
}

websocket.onmessage = function (event) {
    data = JSON.parse(event.data);
    switch (data.type) {
        case 'state':
            value.textContent = data.value;

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

tokenSubmit.onclick = function (event) {
    const scene = game.scene.scenes[0];
    let shape = shapeSelect.value;
    let color = colors[colorSelect.value];
    let depth = depthSelect.value;
    generateToken(scene, null, null, shape, color, depth);
}

let config = {
    parent: 'phaser-container',
    type: Phaser.AUTO,
    width: 900,
    height: 900,
    scene: {
        preload: preload,
        create: create,
    }
};

const game = new Phaser.Game(config);

let tokenCounter = 0;   // TODO:  make better

function preload ()
{
    this.load.image('background', '/static/plasma.png');
    this.load.image('virus', '/static/virus.png');
}

function create ()
{
    // create the background
    const background = this.add.image(450, 450, 'background');

    // create the gameboard
    const grid = this.add.grid(450, 450, 768, 768, 64, 64, 0xf5f5dc, 1);
    let wsState = websocket.readyState;
    if (wsState == websocket.OPEN) {
        websocket.send(JSON.stringify({action: 'ping'}))
    }
    else {
        websocket.onopen = () => {websocket.send(JSON.stringify({action: 'ping'}))};
    }
}

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
        token.x = dragX;
        token.y = dragY;
        websocket.send(JSON.stringify({action: 'move', token: token.name, target: {x: dragX, y: dragY, shape: shape, color: color, depth: depth}}));
    });
}
