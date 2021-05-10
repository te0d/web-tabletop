class TokenManager {
    constructor(scene) {
        this.scene = scene;
        this.id_counter = 0;
    }

    create(x, y, shape, color, depth=2, character='', name=null) {
        // Create new token based on shape
        let token = null;
        x = x || 32;
        y = y || 32;

        if (shape == 'circle') {
            token = this.scene.add.ellipse(x, y, tokenSize, tokenSize, color, 1);
        }
        else if (shape == 'triangle') {
            token = this.scene.add.triangle(x, y, 0, tokenSize, tokenSize/2, 0, tokenSize, tokenSize, color);
        }
        else if (shape == 'horizrectangle') {
            token = this.scene.add.rectangle(x, y, tokenSize, tokenSize/2, color);
        }
        else if (shape == 'vertrectangle') {
            token = this.scene.add.rectangle(x, y, tokenSize/2, tokenSize, color);
        }
        else if (shape == 'star') {
            token = this.scene.add.star(x, y, 5, tokenSize/4, tokenSize/2, color);
        }
        else if (shape == 'virus') {
            token = this.scene.add.image(x, y, 'virus');
        }
        else if (shape == 'character') {
            if (/^\s?$/.test(character)) {
                return;
            }

            if (typeof color == 'number') {
                color = "#" + color.toString(16).padStart(6, "0");
            }

            token = this.scene.add.text(x, y, character, { fontFamily: 'Arial', fontSize: tokenSize, color: color, stroke: "#000", strokeThickness: 2 });
        }

        // Set outline color for simple shape tokens
        if (token.setStrokeStyle) {
            token.setStrokeStyle(1, gridAltColor, 1);
        }

        // If no name provided, generate an unused name
        while (!name) {
            let potential = 'token' + this.id_counter++;
            let existing = this.scene.children.getByName(potential);
            if (!existing) {
                name = potential;
            }
        }
        token.name = name;
        token.depth = depth;

        // Add ability to drag and update server with position
        token.setInteractive();
        this.scene.input.setDraggable(token);
        let properties = {x: x, y: y, shape: shape, color: color, character: character, depth: depth}
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
                let properties = {x: newX, y: newY, shape: shape, color: color, character: character, depth: depth};
                game.sync.update(name, properties);
            }
        });
    }
}
