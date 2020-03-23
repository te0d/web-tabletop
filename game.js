let minus = document.querySelector('.minus'),
    plus = document.querySelector('.plus'),
    value = document.querySelector('.value'),
    users = document.querySelector('.users'),
    addGreenButton = document.querySelector('#addGreenButton'),
    addBlueButton = document.querySelector('#addBlueButton'),
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
                    generateToken(scene, data[name].x, data[name].y, data[name].color, name)
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

addGreenButton.onclick = function (event) {
    const scene = game.scene.scenes[0];
    const greenToken = generateToken(scene, 32, 32, 0x00ff00);
};

addBlueButton.onclick = function (event) {
    const scene = game.scene.scenes[0];
    const blueToken = generateToken(scene, 96, 32, 0x0000ff);
};

let config = {
    parent: 'phaser-container',
    type: Phaser.AUTO,
    width: 900,
    height: 900,
    scene: {
        create: create
    }
};

const game = new Phaser.Game(config);

let tokenCounter = 0;   // TODO:  make better

function create ()
{
    // create the gameboard
    const grid = this.add.grid(450, 450, 768, 768, 64, 64, 0xff0000, 1);
    let wsState = websocket.readyState;
    if (wsState == websocket.OPEN) {
        websocket.send(JSON.stringify({action: 'ping'}))
    }
    else {
        websocket.onopen = () => {websocket.send(JSON.stringify({action: 'ping'}))};
    }
}

function generateToken(scene, x, y, color, name=null)
{
    let token = scene.add.ellipse(x, y, 60, 60, color, 1);
    while (!name) {
        let potential = 'token' + tokenCounter++;
        let existing = scene.children.getByName(potential);
        if (!existing) {
            name = potential;
        }
    }
    token.name = name;
    token.setInteractive();
    scene.input.setDraggable(token);
    websocket.send(JSON.stringify({action: 'move', token: name, target: {x: x, y: y, color: color}}));
    token.on('drag', function (pointer, dragX, dragY) {
        token.x = dragX;
        token.y = dragY;
        websocket.send(JSON.stringify({action: 'move', token: token.name, target: {x: dragX, y: dragY, color: color}}));
    });
}
