class SyncClient {
    constructor(game, address) {
        this.game = game;
        this.websocket = new WebSocket(address);

        this.websocket.onmessage = this.onmessage;
        this.websocket.onopen = function(event) {
            this.send(JSON.stringify({action: "ping"}));
        };
    }

    onmessage(event) {
        const data = JSON.parse(event.data);
        if (data.type ==  'state') {
            const gameboard = game.scene.getScene("gameboard");
            const scene = game.scene.scenes[0];

            const re = RegExp('^token\d*');
            const tokenNames = Object.keys(data).filter((k) => re.test(k));
            tokenNames.forEach((name) => {
                const token = scene.children.getByName(name);
                if (token) {
                    token.x = data[name].x;
                    token.y = data[name].y;
                }
                else {
                    game.token.create(data[name].x, data[name].y, data[name].shape, data[name].color, data[name].depth, name)
                }
            });
        }
        else if (data.type == 'users') {
            users.textContent = (data.count.toString() + " user" + (data.count == 1 ? "" : "s"));
        }
        else {
            console.error("unsupported event", data);
        }
    }

    update(token_id, properties) {
        let message = {
            action: "move",
            token: token_id,
            target: properties,
        };
        this.websocket.send(JSON.stringify(message));
    }
}
