from flask import Blueprint, render_template, redirect, url_for, session, request, flash
from app import db
from app.models.user import User
from functools import wraps
from datetime import datetime

panel_bp = Blueprint("calendario", __name__, url_prefix="/panel")

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Debes iniciar sesión para acceder a esta página", "warning")
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return decorated_function

# Subscription required decorator
def subscription_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Debes iniciar sesión para acceder a esta página", "warning")
            return redirect(url_for("auth.login"))
            
        user = db.session.get(User, session["user_id"])
        if not user or not user.tiene_suscripcion:
            flash("Necesitas una suscripción activa para acceder a esta funcionalidad", "warning")
            return redirect(url_for("auth.suscripcion_page"))
            
        return f(*args, **kwargs)
    return decorated_function

@panel_bp.route("/")
@login_required
def calendario_inicio():
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("auth.login"))
        
    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return redirect(url_for("auth.login"))
        
    return render_template("calendario.html", user=user)

@panel_bp.route("/perfil", methods=["GET", "POST"])
@login_required
def perfil():
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("auth.login"))
    
    return render_template("perfil.html", user=user)