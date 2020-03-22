var minus = document.querySelector('.minus'),
    plus = document.querySelector('.plus'),
    value = document.querySelector('.value'),
    users = document.querySelector('.users'),
    websocket = new WebSocket("ws://192.168.1.19:6789/");
    // websocket = new WebSocket("ws://127.0.0.1:6789/");

var initGreen, initBlue;

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
            if (initGreen) {
                moveToken('green', data.green);
                moveToken('blue', data.blue);
            }
            else {
                initGreen = data.green;
                initBlue = data.blue;
            }
            break;
        case 'users':
            users.textContent = (data.count.toString() + " user" + (data.count == 1 ? "" : "s"));
            break;
        default:
            console.error("unsupported event", data);
    }
};

var config = {
    // canvas: document.getElementById('game-canvas'),
    parent: 'phaser-container',
    type: Phaser.AUTO,
    width: 770,
    height: 770,
    scene: {
        create: create
    }
};

var game = new Phaser.Game(config);

function create ()
{
    var grid = this.add.grid(385, 385, 768, 768, 64, 64, 0xff0000, 1);

    if (initGreen) {
        var greenToken = generateToken(this, initGreen.x, initGreen.y, 0x00ff00, 'green');
        var blueToken = generateToken(this, initBlue.x, initBlue.y, 0x0000ff, 'blue');
    }
    else {
        var greenToken = generateToken(this, 32, 32, 0x00ff00, 'green');
        var blueToken = generateToken(this, 96, 96, 0x0000ff, 'blue');
    }
}

function generateToken(scene, x, y, color, name)
{
    var token = scene.add.ellipse(x, y, 60, 60, color, 1);
    token.name = name;
    token.setInteractive();
    scene.input.setDraggable(token);
    token.on('drag', function (pointer, dragX, dragY) {
        token.x = dragX;
        token.y = dragY;
        websocket.send(JSON.stringify({action: 'move', token: token.name, target: {x: dragX, y: dragY}}));
    });
}

function moveToken(name, target) {
    const token = game.scene.scenes[0].children.getByName(name);    // sexy
    token.x = target.x;
    token.y = target.y;
}
