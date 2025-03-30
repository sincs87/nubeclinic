from flask import Blueprint, render_template, redirect, url_for, session, request, flash
from app import db
from app.models.user import User
from functools import wraps

panel_bp = Blueprint("panel", __name__, url_prefix="/panel")

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
def panel_inicio():
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("auth.login"))
        
    return render_template("panel.html", user=user)

@panel_bp.route("/perfil", methods=["GET", "POST"])
@login_required
def perfil():
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("auth.login"))
    
    if request.method == "POST":
        try:
            # Actualizar datos básicos
            user.name = request.form["name"]
            user.surname = request.form["surname"]
            user.specialty = request.form["specialty"]
            user.location = request.form["location"]
            user.phone = request.form["phone"]
            
            # Actualizar datos de perfil profesional
            user.bio = request.form.get("bio", "")
            user.consultation_price = float(request.form.get("consultation_price", 0))
            user.consultation_duration = int(request.form.get("consultation_duration", 30))
            user.languages = request.form.get("languages", "")
            user.education = request.form.get("education", "")
            user.experience = request.form.get("experience", "")
            
            # Manejar la foto de perfil si se sube
            if "profile_image" in request.files and request.files["profile_image"].filename != "":
                file = request.files["profile_image"]
                # Aquí irá la lógica para guardar la imagen
                # Por ejemplo, guardarla en un bucket de S3 o en el sistema de archivos
                # user.profile_image = url_de_la_imagen
            
            db.session.commit()
            flash("Perfil actualizado correctamente", "success")
        except Exception as e:
            db.session.rollback()
            flash(f"Error al actualizar el perfil: {str(e)}", "danger")
    
    return render_template("perfil.html", user=user)

@panel_bp.route("/agenda")
@login_required
@subscription_required
def agenda():
    user = db.session.get(User, session["user_id"])
    return render_template("agenda.html", user=user)

@panel_bp.route("/pacientes")
@login_required
@subscription_required
def pacientes():
    user = db.session.get(User, session["user_id"])
    return render_template("pacientes.html", user=user)

@panel_bp.route("/consultas")
@login_required
@subscription_required
def consultas():
    user = db.session.get(User, session["user_id"])
    return render_template("consultas.html", user=user)

@panel_bp.route("/telemedicina")
@login_required
@subscription_required
def telemedicina():
    user = db.session.get(User, session["user_id"])
    return render_template("telemedicina.html", user=user)

@panel_bp.route("/facturacion")
@login_required
@subscription_required
def facturacion():
    user = db.session.get(User, session["user_id"])
    return render_template("facturacion.html", user=user)

@panel_bp.route("/estadisticas")
@login_required
@subscription_required
def estadisticas():
    user = db.session.get(User, session["user_id"])
    return render_template("estadisticas.html", user=user)

@panel_bp.route("/configuracion")
@login_required
def configuracion():
    user = db.session.get(User, session["user_id"])
    return render_template("configuracion.html", user=user)