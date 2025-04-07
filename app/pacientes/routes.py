from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, flash
from flask import current_app as app
from app import db
from app.models.paciente import Paciente
from app.models.user import User
from functools import wraps
import uuid
from datetime import datetime
from sqlalchemy import or_, and_, desc

pacientes_bp = Blueprint("pacientes", __name__, url_prefix="/pacientes")

# Decoradores
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Debes iniciar sesión para acceder a esta página", "warning")
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return decorated_function

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

# Listado de pacientes
@pacientes_bp.route("/", methods=["GET"])
@login_required
def lista_pacientes():
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        flash("Usuario no encontrado", "danger")
        return redirect(url_for("auth.login"))

    base_query = Paciente.query.filter_by(tenant_id=user.tenant_id, eliminado=False)

    tipo_filtro = request.args.get('filtro')
    valor_filtro = request.args.get('valor')
    filtro_aplicado = None

    if tipo_filtro and valor_filtro:
        filtro_aplicado = {'tipo': tipo_filtro, 'valor': valor_filtro}
        if tipo_filtro == 'autorizacion':
            base_query = base_query.filter(Paciente.autorizacion == valor_filtro)
        elif tipo_filtro == 'email':
            if valor_filtro == 'disponible':
                base_query = base_query.filter(Paciente.email.isnot(None), Paciente.email != '')
            else:
                base_query = base_query.filter(or_(Paciente.email.is_(None), Paciente.email == ''))
        elif tipo_filtro == 'telefono':
            if valor_filtro == 'disponible':
                base_query = base_query.filter(Paciente.telefono.isnot(None), Paciente.telefono != '')
            else:
                base_query = base_query.filter(or_(Paciente.telefono.is_(None), Paciente.telefono == ''))
        elif tipo_filtro == 'estado':
            if valor_filtro == 'activo':
                base_query = base_query.filter(Paciente.siguiente_visita.isnot(None), Paciente.siguiente_visita > datetime.utcnow())
            elif valor_filtro == 'inactivo':
                base_query = base_query.filter(or_(Paciente.siguiente_visita.is_(None), Paciente.siguiente_visita < datetime.utcnow()))

    orden = request.args.get('orden', 'nombre')
    if orden == 'nombre':
        base_query = base_query.order_by(Paciente.nombre)
    elif orden == 'apellido':
        base_query = base_query.order_by(Paciente.apellidos)
    elif orden == 'ultima_visita':
        base_query = base_query.order_by(Paciente.ultima_visita.is_(None), desc(Paciente.ultima_visita))
    elif orden == 'siguiente_visita':
        base_query = base_query.order_by(Paciente.siguiente_visita.is_(None), Paciente.siguiente_visita)
    elif orden == 'numero_paciente':
        base_query = base_query.order_by(Paciente.id)

    pacientes = base_query.all()

    return render_template(
        "pacientes/pacientes.html", 
        pacientes=pacientes, 
        user=user, 
        total_pacientes=len(pacientes),
        filtro_aplicado=filtro_aplicado,
        ordenacion_aplicada=orden
    )

# Crear paciente
@pacientes_bp.route("/crear", methods=["POST"])
@login_required
def crear_paciente():
    data = request.get_json()
    if not data.get("nombre") or not data.get("apellidos"):
        return jsonify({"success": False, "error": "El nombre y apellidos son obligatorios"})

    user = db.session.get(User, session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Usuario no encontrado"})

    try:
        paciente_id = str(uuid.uuid4())
        nuevo_paciente = Paciente(
            id=paciente_id,
            nombre=data.get("nombre"),
            apellidos=data.get("apellidos"),
            telefono=data.get("telefono", ""),
            telefono_adicional=data.get("telefono_adicional", ""),
            email=data.get("email", ""),
            dni=data.get("dni", ""),
            tipo_paciente=data.get("tipo_paciente", "Privado"),
            aseguradora_id=data.get("aseguradora_id"),
            numero_poliza=data.get("numero_poliza"),
            autorizacion=data.get("autorizacion", "Aceptado"),
            tenant_id=user.tenant_id,
            creado_por=user.id,
            creado_en=datetime.utcnow()
        )
        fecha_nacimiento = data.get("fecha_nacimiento")
        if fecha_nacimiento:
            try:
                nuevo_paciente.fecha_nacimiento = datetime.strptime(fecha_nacimiento, "%Y-%m-%d").date()
            except ValueError:
                app.logger.warning(f"Formato de fecha inválido: {fecha_nacimiento}")

        db.session.add(nuevo_paciente)
        db.session.commit()

        return jsonify({"success": True, "paciente_id": paciente_id, "message": "Paciente creado correctamente", "paciente": nuevo_paciente.to_dict()})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error al crear paciente: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

# Ficha paciente (GET)
@pacientes_bp.route("/<string:paciente_id>/edit", methods=["GET"])
@login_required
def ficha_paciente(paciente_id):
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("auth.login"))

    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id).first()
    if not paciente:
        flash("Paciente no encontrado", "danger")
        return redirect(url_for("pacientes.lista_pacientes"))

    return render_template("pacientes/paciente_detalle.html", paciente=paciente)

# Actualizar paciente desde ficha (POST)
@pacientes_bp.route("/<string:paciente_id>/edit", methods=["POST"])
@login_required
def actualizar_paciente(paciente_id):
    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("auth.login"))

    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id).first()
    if not paciente:
        flash("Paciente no encontrado", "danger")
        return redirect(url_for("pacientes.lista_pacientes"))

    paciente.nombre = request.form.get("nombre", "")
    paciente.apellidos = request.form.get("apellidos", "")
    paciente.genero = request.form.get("genero", "")
    paciente.tipo_paciente = request.form.get("tipo_paciente", "")
    paciente.estado = request.form.get("estado", "")
    paciente.email = request.form.get("email", "")
    paciente.telefono = request.form.get("telefono", "")
    paciente.dni = request.form.get("dni", "")
    paciente.ciudad = request.form.get("ciudad", "")
    paciente.provincia = request.form.get("provincia", "")
    paciente.nacionalidad = request.form.get("nacionalidad", "")
    paciente.notas = request.form.get("notas", "")
    
    if request.form.get("fecha_nacimiento"):
        try:
            paciente.fecha_nacimiento = datetime.strptime(request.form.get("fecha_nacimiento"), "%Y-%m-%d").date()
        except ValueError:
            pass

    paciente.actualizado_en = datetime.utcnow()
    paciente.actualizado_por = user.id

    db.session.commit()
    flash("Datos del paciente actualizados", "success")
    return redirect(url_for("ficha_paciente", paciente_id=paciente.id))
