from flask import Blueprint, session, redirect, url_for, render_template
from app.models.user import User
from app import db
from app.utils.stripe import tiene_suscripcion_activa

panel_bp = Blueprint("panel", __name__, url_prefix="/panel")

@panel_bp.route("/")
def panel_inicio():
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("auth.login"))

    user = db.session.get(User, user_id)
    if not user or not user.stripe_customer_id:
        return redirect(url_for("auth.suscripcion"))

    if not tiene_suscripcion_activa(user.stripe_customer_id):
        return redirect(url_for("auth.suscripcion"))

    return render_template("panel.html", user=user)
