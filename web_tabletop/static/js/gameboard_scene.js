var GameboardScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize:
    function GameboardScene() {
        Phaser.Scene.call(this, { key: 'gameboard' });
    },

    preload: function () {
        this.load.image('virus', '/static/img/virus.png');
        this.load.image('map', '/static/img/map.jpg');
    },

    create: function () {
        // Setup some input
        // TODO:  make not global
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

        UI.mapToggle.onclick = function (event) {
            testMap.setAlpha(testMap.alpha == 1 ? 0 : 1);
        }

        // Create the gameboard
        const grid = this.add.grid(fieldSize/2, fieldSize/2, gridSize, gridSize, gridSquareSize, gridSquareSize, gridColor, gridAlpha, gridLineColor, gridLineAlpha)
            .setAltFillStyle(gridAltColor, gridAltAlpha);
        grid.name = 'gameboard';
        grid.depth = 1;

        // test map
        const testMap = this.add.image(fieldSize/2, fieldSize/2, 'map');
        testMap.depth = -1;

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
