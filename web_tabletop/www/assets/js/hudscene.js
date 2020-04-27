var HudScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize:
    function HudScene() {
        Phaser.Scene.call(this, { key: 'hud' });
    },

    create: function () {
        // Create text object for distance measure
        const distanceText = this.add.text(96, 10)
            .setFontFamily('"Courier New", sans-serif')
            .setFontSize(24)
            .setColor('#ffffff')
            .setText('Distance: 0')
            .setShadow(1, 1, '#000000', 2);

        // Hook into game objects' drag events to update distance
        const gameboard = this.scene.get('gameboard');
        gameboard.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            // Update distance measure from pointer to original token location
            let deltaX = pointer.worldX - gameObject.input.dragStartX;
            let deltaY = pointer.worldY - gameObject.input.dragStartY;
            let distance = Math.sqrt(deltaX**2 + deltaY**2);

            // Show distance in grid squares rounded to a single decimal place
            let prettyDistance = Math.round(distance/gridSquareSize * 10) / 10;
            distanceText.setText('Distance: ' + prettyDistance);
        });
    },
});
