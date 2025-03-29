from flask import Blueprint, render_template, request
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Aquí luego haremos la validación
        return "<h3>Login recibido</h3>"

    return render_template("login.html")
@auth_bp.route("/register")
def register():
    return "<h1>Página de registro</h1>"

