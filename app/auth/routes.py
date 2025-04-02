from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models.user import User
import uuid
import stripe
import os
from datetime import datetime
from flask import current_app


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # Check if email already exists
        existing_user = User.query.filter_by(email=request.form["email"]).first()
        if existing_user:
            flash("Este email ya está registrado. Por favor, utiliza otro o inicia sesión.", "danger")
            return render_template("register.html")
        
        # Procesar especialidades (pueden venir como JSON de Tagify o como lista)
        try:
            # Intentar procesar como JSON (Tagify)
            import json
            specialties_json = request.form.get("specialties", "[]")
            specialties_data = json.loads(specialties_json)
            specialties = [item.get("value") for item in specialties_data if item.get("value")]
        except (json.JSONDecodeError, AttributeError, KeyError):
            # Si falla JSON, intentar procesar como lista separada por comas
            specialties = [s.strip() for s in request.form.get("specialties", "").split(',') if s.strip()]
        
        # Validar especialidades
        if not specialties:
            flash("Debes seleccionar al menos una especialidad", "danger")
            return render_template("register.html")
        
        # Procesar ubicación y provincia
        location = request.form.get("location", "").split(',')[0].strip()
        province = request.form.get("province", "").strip()
        
        # Si no se proporcionó provincia, intentar extraerla de la ubicación
        if not province and "," in request.form.get("location", ""):
            location_parts = request.form.get("location").split(',')
            if len(location_parts) > 1:
                province = location_parts[1].strip()
        
        # Generar tenant_id basado en el nombre de la clínica o el nombre del usuario
        clinic_name = request.form.get("clinic_name", "").strip()
        tenant_base = clinic_name if clinic_name else f"{request.form['name']} {request.form['surname']}".strip()
        import uuid
        tenant_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, tenant_base.lower()))
        
        # Crear usuario
        from datetime import datetime
        user = User(
            id=str(uuid.uuid4()),
            name=request.form["name"],
            surname=request.form["surname"],
            clinic_name=clinic_name if clinic_name else None,
            specialties=specialties,
            location=location,
            province=province,
            country_code=request.form["country_code"],
            phone=request.form["phone"],
            email=request.form["email"],
            password_hash=generate_password_hash(request.form["password"], method='pbkdf2:sha256'),
            tenant_id=tenant_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        try:
            db.session.add(user)
            db.session.commit()
            
            # Log exitoso para depuración
            print(f"Usuario registrado correctamente: {user.email}, Especialidades: {user.specialties}")
            
            flash("Registro exitoso. Ya puedes iniciar sesión.", "success")
            return redirect(url_for("auth.login"))
        except Exception as e:
            db.session.rollback()
            print(f"Error al registrar usuario: {str(e)}")
            flash(f"Error al registrar: {str(e)}", "danger")
            
    return render_template("register.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    error = None

    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            session["user_id"] = str(user.id)
            session["user_name"] = user.name
            session["user_email"] = user.email
            return redirect(url_for("panel.panel_inicio"))
        else:
            error = "Credenciales incorrectas"
            flash("Email o contraseña incorrectos. Por favor, inténtalo de nuevo.", "danger")

    return render_template("login.html", error=error)

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

@auth_bp.route("/crear-suscripcion")
def crear_suscripcion():
    plan = request.args.get("plan", "plus")  # Por defecto, plan Plus
    
    # Mapeo de planes a IDs de productos en Stripe
    planes_stripe = {
        "starter": "price_1OaxhGAhf7qybv3y5EO168s3",  # ID del plan Starter
        "plus": "price_1OaxhGAhf7qybv3y5EO168s3",     # ID del plan Plus (usar el ID real)
        "vip": "price_1OaxhGAhf7qybv3y5EO168s3"       # ID del plan VIP (usar el ID real)
    }
    
    price_id = planes_stripe.get(plan, planes_stripe["plus"])
    
    user_id = session.get("user_id")
    if not user_id:
        flash("Debes iniciar sesión para crear una suscripción", "warning")
        return redirect(url_for("auth.login"))

    user = db.session.get(User, user_id)
    if not user:
        flash("Usuario no encontrado", "danger")
        session.clear()
        return redirect(url_for("auth.login"))

    # Crear cliente en Stripe si no existe
    if not user.stripe_customer_id:
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.name} {user.surname}",
            )
            user.stripe_customer_id = customer.id
            user.updated_at = datetime.utcnow()
            db.session.commit()
        except Exception as e:
            flash(f"Error al crear cliente en Stripe: {str(e)}", "danger")
            return redirect(url_for("auth.suscripcion_page"))
    else:
        try:
            customer = stripe.Customer.retrieve(user.stripe_customer_id)
        except Exception as e:
            flash(f"Error al recuperar cliente de Stripe: {str(e)}", "danger")
            return redirect(url_for("auth.suscripcion_page"))

    # Crear sesión de Checkout
    try:
        session_stripe = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url="https://pro.nubeclinic.com/panel",
            cancel_url="https://pro.nubeclinic.com/auth/suscripcion",
        )
        return redirect(session_stripe.url, code=303)
    except Exception as e:
        flash(f"Error al crear sesión de pago: {str(e)}", "danger")
        return redirect(url_for("auth.suscripcion_page"))

@auth_bp.route("/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except Exception as e:
        return str(e), 400

    # Detectar evento de suscripción activa
    if event["type"] == "customer.subscription.created":
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]

        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.tiene_suscripcion = True
            user.updated_at = datetime.utcnow()
            db.session.commit()
    
    # Evento de cancelación o expiración
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.tiene_suscripcion = False
            user.updated_at = datetime.utcnow()
            db.session.commit()

    return "OK", 200

@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("Has cerrado sesión correctamente", "info")
    return redirect(url_for("main.index"))

@auth_bp.route("/suscripcion")
def suscripcion_page():
    user_id = session.get("user_id")
    if not user_id:
        flash("Debes iniciar sesión para ver esta página", "warning")
        return redirect(url_for("auth.login"))
        
    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return redirect(url_for("auth.login"))
        
    return render_template("suscripcion.html", user=user)

from itsdangerous import URLSafeTimedSerializer
from datetime import datetime, timedelta
import secrets



from flask_mail import Message
from app import mail  

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])  # ✅ Perfecto
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user:
            token = secrets.token_urlsafe(32)
            user.reset_token = token
            user.reset_token_expiration = datetime.utcnow() + timedelta(minutes=15)
            db.session.commit()

            reset_url = url_for('auth_bp.reset_password', token=token, _external=True)

            msg = Message('Recuperación de contraseña - NubeClinic',
                          recipients=[user.email])
            msg.body = f"""Hola {user.name},

                Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:

                {reset_url}

                Este enlace caduca en 15 minutos. Si no solicitaste esto, ignora este mensaje.

                Un saludo,
                El equipo de NubeClinic
"""
            mail.send(msg)

            flash('Te hemos enviado un correo con instrucciones para restablecer tu contraseña.', 'success')
        else:
            flash('No hay ninguna cuenta con ese correo.', 'danger')

        return redirect(url_for('auth_bp.forgot_password'))

    return render_template('auth/forgot_password.html')


@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    user = User.query.filter_by(reset_token=token).first()

    if not user or user.reset_token_expiration < datetime.utcnow():
        flash('El enlace ha caducado o no es válido.', 'danger')
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        new_password = request.form['password']
        confirm = request.form['confirm_password']

        if new_password != confirm:
            flash('Las contraseñas no coinciden.', 'danger')
            return redirect(request.url)

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiration = None
        db.session.commit()

        flash('Contraseña actualizada. Ya puedes iniciar sesión.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('auth/reset_password.html', token=token)


