# web-tabletop

A web application made to help recreate tabletop games, like Settlers of Catan,
by creating a virtual tabletop with Phaser. Users share the same board and can
see each other's actions live. Tokens representing game pieces can be spawned
and controlled by users.

## Install

Install the `requirements.txt`.

Set up the flask environment variables.
```
export FLASK_APP=web_tabletop
export FLASK_ENV=dev
```

*Being deprecated:*
*Set up a static web server for the `www` folder.*

## Usage

Start the python websocket server.

`cd web_tabletop && python sync_server.py`

Start the web server. :

`flask run`

## Contributing

PRs accepted, but may not be checked frequently or ever.

## License

ISC © Tom O'Donnell
