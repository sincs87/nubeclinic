from flask import Blueprint, render_template, request, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models.user import User
import uuid

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        user = User(
            id=str(uuid.uuid4()),
            name=request.form["name"],
            surname=request.form["surname"],
            specialty=request.form["specialty"],
            location=request.form["location"],
            phone=request.form["phone"],
            email=request.form["email"],
            password_hash=generate_password_hash(request.form["password"]),
        )
        db.session.add(user)
        db.session.commit()
        return redirect("/panel")

    return render_template("register.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    error = None

    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            return redirect("/panel")
        else:
            error = "Credenciales incorrectas"

    return render_template("login.html", error=error)
