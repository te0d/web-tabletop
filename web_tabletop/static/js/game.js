let gridSquareCount = 24;
if (game_type == "checker") {
    gridSquareCount = 8;
}

const canvasSize = 900;
const canvasColor = 0x343a40;
const gridSquareSize = 64;
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
    game.token.create(null, null, shape, color, depth);
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
            game.token = new TokenManager(game.scene.getScene("gameboard"));
        },
    },
};

const game = new Phaser.Game(config);
