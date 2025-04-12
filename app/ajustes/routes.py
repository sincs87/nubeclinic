from flask import Blueprint, render_template
ajustes = Blueprint("ajustes", __name__)

@ajustes.route("/ajustes")
def ajustes_inicio():
    return render_template("profesional/ajustes.html")
