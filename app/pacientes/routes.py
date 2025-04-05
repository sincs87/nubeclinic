from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, flash
from flask import current_app as app
from app import db
from app.models.paciente import Paciente
from app.models.user import User
from functools import wraps
import uuid
from datetime import datetime

pacientes_bp = Blueprint("pacientes", __name__, url_prefix="/pacientes")

# Decorador para verificar si el usuario está autenticado
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Debes iniciar sesión para acceder a esta página", "warning")
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return decorated_function

# Decorador para verificar si el usuario tiene suscripción
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

@pacientes_bp.route("/", methods=["GET"])
@login_required
def lista_pacientes():
    # Obtener el tenant_id del usuario actual para asegurar que solo ve sus pacientes
    user = db.session.get(User, session["user_id"])
    
    # Usar tenant_id para filtrar pacientes
    pacientes = Paciente.query.filter_by(tenant_id=user.tenant_id).order_by(Paciente.nombre).all()
    
    return render_template("pacientes/pacientes.html", pacientes=pacientes, user=user)

@pacientes_bp.route("/crear", methods=["POST"])
@login_required
def crear_paciente():
    # Obtener datos del JSON enviado
    data = request.get_json()
    
    # Verificar que los campos requeridos estén presentes
    if not data.get("nombre") or not data.get("apellidos"):
        return jsonify({"success": False, "error": "El nombre y apellidos son obligatorios"})
    
    # Obtener el tenant_id del usuario actual
    user = db.session.get(User, session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Usuario no encontrado"})
    
    try:
        # Generar un id único usando uuid
        paciente_id = str(uuid.uuid4())
        
        # Preparar el objeto Paciente con todos los campos posibles
        nuevo_paciente = Paciente(
            id=paciente_id,
            nombre=data.get("nombre"),
            apellidos=data.get("apellidos"),
            telefono=data.get("telefono", ""),
            email=data.get("email", ""),
            tipo_paciente=data.get("tipo_paciente", "Privado"),
            dni=data.get("dni", ""),
            autorizacion=data.get("autorizacion", "Aceptado"),
            tenant_id=user.tenant_id,  # Asignar el tenant_id del usuario
            creado_por=user.id,
            creado_en=datetime.utcnow()
        )
        
        # Guardar en la base de datos
        db.session.add(nuevo_paciente)
        db.session.commit()
        
        # Devolver éxito y el ID del nuevo paciente
        return jsonify({
            "success": True, 
            "paciente_id": paciente_id,
            "message": "Paciente creado correctamente"
        })
    
    except Exception as e:
        # Manejar cualquier error durante la creación
        db.session.rollback()
        app.logger.error(f"Error al crear paciente: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@pacientes_bp.route("/<paciente_id>/editar", methods=["GET", "POST"])
@login_required
def editar_paciente(paciente_id):
    # Obtener el tenant_id del usuario actual
    user = db.session.get(User, session["user_id"])
    
    # Buscar el paciente, asegurándose que pertenece al mismo tenant_id
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id).first()
    
    if not paciente:
        flash("Paciente no encontrado", "warning")
        return redirect(url_for("pacientes.lista_pacientes"))
    
    if request.method == "POST":
        try:
            # Actualizar datos del paciente
            paciente.nombre = request.form.get("nombre")
            paciente.apellidos = request.form.get("apellidos")
            paciente.telefono = request.form.get("telefono", "")
            paciente.email = request.form.get("email", "")
            paciente.tipo_paciente = request.form.get("tipo_paciente")
            paciente.dni = request.form.get("dni", "")
            paciente.autorizacion = request.form.get("autorizacion", "Aceptado")
            paciente.actualizado_en = datetime.utcnow()
            paciente.actualizado_por = user.id
            
            db.session.commit()
            
            flash("Paciente actualizado correctamente", "success")
            return redirect(url_for("pacientes.lista_pacientes"))
        
        except Exception as e:
            db.session.rollback()
            flash(f"Error al actualizar paciente: {str(e)}", "danger")
    
    return render_template("pacientes/editar_paciente.html", paciente=paciente, user=user)

@pacientes_bp.route("/<paciente_id>/eliminar", methods=["POST"])
@login_required
def eliminar_paciente(paciente_id):
    # Obtener el tenant_id del usuario actual
    user = db.session.get(User, session["user_id"])
    
    # Buscar el paciente, asegurándose que pertenece al mismo tenant_id
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id).first()
    
    if not paciente:
        return jsonify({"success": False, "error": "Paciente no encontrado"})
    
    try:
        # Eliminación lógica: marcar como eliminado en lugar de borrar
        paciente.eliminado = True
        paciente.eliminado_en = datetime.utcnow()
        paciente.eliminado_por = user.id
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "Paciente eliminado correctamente"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@pacientes_bp.route("/<paciente_id>/agregar-email", methods=["POST"])
@login_required
def agregar_email(paciente_id):
    data = request.get_json()
    
    # Verificar que el email esté presente
    if not data.get("email"):
        return jsonify({"success": False, "error": "El email es obligatorio"})
    
    # Obtener el tenant_id del usuario actual
    user = db.session.get(User, session["user_id"])
    
    # Buscar el paciente, asegurándose que pertenece al mismo tenant_id
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id).first()
    
    if not paciente:
        return jsonify({"success": False, "error": "Paciente no encontrado"})
    
    try:
        # Actualizar el email del paciente
        paciente.email = data.get("email")
        paciente.actualizado_en = datetime.utcnow()
        paciente.actualizado_por = user.id
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "Email añadido correctamente"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})