import secrets

from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for
)
from werkzeug.exceptions import abort

from web_tabletop.db import get_db

bp = Blueprint("tabletops", __name__)

def get_tabletop(id):
    tabletop = get_db().execute(
        "SELECT t.id, t.token, t.name, t.created, t.updated"
        " FROM tabletops t"
        " WHERE t.id = ?",
        (id,)
    ).fetchone()

    if tabletop is None:
        abort(404, "Cannot find tabletop#{0}".format(id))

    return tabletop

def get_tabletop_by_token(token):
    tabletop = get_db().execute(
        "SELECT t.id, t.token, t.name, t.created, t.updated"
        " FROM tabletops t"
        " WHERE t.token = ?",
        (token,)
    ).fetchone()

    if tabletop is None:
        abort(404, "Cannot find tabletop##{0}".format(token))

    return tabletop

@bp.route("/")
def index():
    db = get_db()
    tabletops = db.execute(
        "SELECT t.id, t.token, t.name, t.created, t.updated"
        " FROM tabletops t"
        " ORDER BY created DESC"
    ).fetchall()
    return render_template("tabletops/index.html", tabletops=tabletops)

@bp.route("/create", methods=("GET", "POST"))
def create():
    if request.method == "POST":
        token = secrets.token_urlsafe(16)
        name = request.form["name"] or token[:6]

        db = get_db()
        db.execute(
            "INSERT INTO tabletops (token, name)"
            " VALUES (?, ?)",
            (token, name)
        )
        db.commit()
        return redirect(url_for("tabletops.index"))

    return render_template("tabletops/create.html")

@bp.route("/t/<token>")
def play(token):
    tabletop = get_tabletop_by_token(token)
    return render_template("tabletops/play.html", tabletop=tabletop)

@bp.route("/delete/<int:id>", methods=("POST",))
def delete(id):
    get_tabletop(id)
    db = get_db()
    db.execute("DELETE FROM tabletops WHERE id = ?", (id,))
    db.commit()
    return redirect(url_for("tabletops.index"))
