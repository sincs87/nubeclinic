from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, flash
from flask import current_app as app
from app import db
from app.models.paciente import Paciente
from app.models.user import User
from functools import wraps
import uuid
from datetime import datetime, timedelta
from sqlalchemy import or_, and_, not_

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
    
    if not user:
        session.clear()
        flash("Usuario no encontrado", "danger")
        return redirect(url_for("auth.login"))
    
    # Filtro inicial - solo pacientes no eliminados y del tenant actual
    base_query = Paciente.query.filter_by(tenant_id=user.tenant_id, eliminado=False)
    
    # Aplicar filtros desde la URL (si existen)
    tipo_filtro = request.args.get('filtro')
    valor_filtro = request.args.get('valor')
    
    # Filtrar por tipo específico
    if tipo_filtro and valor_filtro:
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
                # Si tiene cita programada futura
                base_query = base_query.filter(Paciente.siguiente_visita.isnot(None), Paciente.siguiente_visita > datetime.utcnow())
            elif valor_filtro == 'inactivo':
                base_query = base_query.filter(or_(Paciente.siguiente_visita.is_(None), Paciente.siguiente_visita < datetime.utcnow()))
    
    # Ordenar por diferentes criterios
    orden = request.args.get('orden', 'nombre')
    if orden == 'nombre':
        base_query = base_query.order_by(Paciente.nombre)
    elif orden == 'apellido':
        base_query = base_query.order_by(Paciente.apellidos)
    elif orden == 'ultima_visita':
        base_query = base_query.order_by(Paciente.ultima_visita.desc())
    elif orden == 'siguiente_visita':
        base_query = base_query.order_by(Paciente.siguiente_visita)
    
    # Ejecutar la consulta
    pacientes = base_query.all()
    
    return render_template("pacientes/pacientes.html", pacientes=pacientes, user=user, total_pacientes=len(pacientes))

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
            telefono_adicional=data.get("telefono_adicional", ""),
            email=data.get("email", ""),
            dni=data.get("dni", ""),
            tipo_paciente=data.get("tipo_paciente", "Privado"),
            aseguradora_id=data.get("aseguradora_id", None),
            numero_poliza=data.get("numero_poliza", None),
            fecha_nacimiento=None,  # Se actualizará después si está disponible
            autorizacion=data.get("autorizacion", "Aceptado"),
            tenant_id=user.tenant_id,  # Asignar el tenant_id del usuario
            creado_por=user.id,
            creado_en=datetime.utcnow()
        )
        
        # Procesamiento de fecha de nacimiento si existe
        fecha_nacimiento = data.get("fecha_nacimiento")
        if fecha_nacimiento:
            try:
                if isinstance(fecha_nacimiento, str):
                    nuevo_paciente.fecha_nacimiento = datetime.strptime(fecha_nacimiento, "%Y-%m-%d").date()
            except ValueError:
                app.logger.warning(f"Formato de fecha inválido: {fecha_nacimiento}")
        
        # Guardar en la base de datos
        db.session.add(nuevo_paciente)
        db.session.commit()
        
        # Devolver éxito y el ID del nuevo paciente
        return jsonify({
            "success": True, 
            "paciente_id": paciente_id,
            "message": "Paciente creado correctamente",
            "paciente": nuevo_paciente.to_dict()
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
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id, eliminado=False).first()
    
    if not paciente:
        flash("Paciente no encontrado", "warning")
        return redirect(url_for("pacientes.lista_pacientes"))
    
    if request.method == "POST":
        try:
            # Actualizar datos del paciente
            paciente.nombre = request.form.get("nombre")
            paciente.apellidos = request.form.get("apellidos")
            paciente.telefono = request.form.get("telefono", "")
            paciente.telefono_adicional = request.form.get("telefono_adicional", "")
            paciente.email = request.form.get("email", "")
            paciente.dni = request.form.get("dni", "")
            paciente.tipo_paciente = request.form.get("tipo_paciente")
            paciente.autorizacion = request.form.get("autorizacion", "Aceptado")
            
            # Campos adicionales si están presentes
            if request.form.get("fecha_nacimiento"):
                try:
                    paciente.fecha_nacimiento = datetime.strptime(
                        request.form.get("fecha_nacimiento"), "%Y-%m-%d"
                    ).date()
                except ValueError:
                    pass
                    
            paciente.genero = request.form.get("genero", paciente.genero)
            
            # Si es de aseguradora
            if paciente.tipo_paciente == "De aseguradora":
                paciente.aseguradora_id = request.form.get("aseguradora_id")
                paciente.numero_poliza = request.form.get("numero_poliza")
            
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
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id, eliminado=False).first()
    
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

@pacientes_bp.route("/buscar", methods=["GET"])
@login_required
def buscar_pacientes():
    # Obtener el tenant_id del usuario actual
    user = db.session.get(User, session["user_id"])
    
    # Obtener el término de búsqueda
    termino = request.args.get("termino", "")
    
    if not termino:
        return jsonify({"success": False, "error": "Término de búsqueda requerido"})
    
    try:
        # Buscar pacientes que coincidan con el término (nombre, apellidos, teléfono o email)
        # Y que pertenezcan al mismo tenant_id y no estén eliminados
        resultados = Paciente.query.filter(
            and_(
                Paciente.tenant_id == user.tenant_id,
                Paciente.eliminado == False,
                or_(
                    Paciente.nombre.ilike(f"%{termino}%"),
                    Paciente.apellidos.ilike(f"%{termino}%"),
                    Paciente.telefono.ilike(f"%{termino}%"),
                    Paciente.email.ilike(f"%{termino}%"),
                    Paciente.dni.ilike(f"%{termino}%")
                )
            )
        ).all()
        
        # Convertir resultados a formato JSON
        pacientes_json = [paciente.to_dict() for paciente in resultados]
        
        return jsonify({"success": True, "resultados": pacientes_json})
    
    except Exception as e:
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
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id, eliminado=False).first()
    
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

@pacientes_bp.route("/<paciente_id>/agregar-telefono", methods=["POST"])
@login_required
def agregar_telefono(paciente_id):
    data = request.get_json()
    
    # Verificar que el teléfono esté presente
    if not data.get("telefono"):
        return jsonify({"success": False, "error": "El teléfono es obligatorio"})
    
    # Obtener el tenant_id del usuario actual
    user = db.session.get(User, session["user_id"])
    
    # Buscar el paciente, asegurándose que pertenece al mismo tenant_id
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id, eliminado=False).first()
    
    if not paciente:
        return jsonify({"success": False, "error": "Paciente no encontrado"})
    
    try:
        # Si el campo principal está vacío, usar ese primero
        if not paciente.telefono:
            paciente.telefono = data.get("telefono")
        else:
            # Si no, usar el campo adicional
            paciente.telefono_adicional = data.get("telefono")
            
        paciente.actualizado_en = datetime.utcnow()
        paciente.actualizado_por = user.id
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "Teléfono añadido correctamente"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})

@pacientes_bp.route("/<paciente_id>/agregar-dni", methods=["POST"])
@login_required
def agregar_dni(paciente_id):
    data = request.get_json()
    
    # Verificar que el DNI esté presente
    if not data.get("dni"):
        return jsonify({"success": False, "error": "El DNI es obligatorio"})
    
    # Obtener el tenant_id del usuario actual
    user = db.session.get(User, session["user_id"])
    
    # Buscar el paciente, asegurándose que pertenece al mismo tenant_id
    paciente = Paciente.query.filter_by(id=paciente_id, tenant_id=user.tenant_id, eliminado=False).first()
    
    if not paciente:
        return jsonify({"success": False, "error": "Paciente no encontrado"})
    
    try:
        # Actualizar el DNI del paciente
        paciente.dni = data.get("dni")
        paciente.actualizado_en = datetime.utcnow()
        paciente.actualizado_por = user.id
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "DNI añadido correctamente"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)})