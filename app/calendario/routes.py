from flask import Blueprint, render_template, redirect, url_for, session, flash
from app import db
from app.models.user import User
from functools import wraps

calendario_bp = Blueprint("calendario", __name__, url_prefix="/panel")

# Decorador para verificar login
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Debes iniciar sesión para acceder a esta página", "warning")
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return decorated_function

# Decorador para verificar suscripción activa
def subscription_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = db.session.get(User, session.get("user_id"))
        if not user or not user.tiene_suscripcion:
            flash("Necesitas una suscripción activa para acceder a esta funcionalidad", "warning")
            return redirect(url_for("auth.suscripcion_page"))
        return f(*args, **kwargs)
    return decorated_function

@calendario_bp.route("/")
@login_required
def calendario_inicio():
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        flash("Sesión inválida. Inicia sesión nuevamente.", "warning")
        return redirect(url_for("auth.login"))

    return render_template("calendario/calendario.html", user=user)

@calendario_bp.route("/perfil", methods=["GET", "POST"])
@login_required
def perfil():
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        flash("Sesión inválida. Inicia sesión nuevamente.", "warning")
        return redirect(url_for("auth.login"))
    
    return render_template("perfil.html", user=user)
