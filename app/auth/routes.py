from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models.user import User
import uuid
import stripe
import os

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # Check if email already exists
        existing_user = User.query.filter_by(email=request.form["email"]).first()
        if existing_user:
            flash("Este email ya está registrado. Por favor, utiliza otro o inicia sesión.", "danger")
            return render_template("register.html")
            
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
        
        try:
            db.session.add(user)
            db.session.commit()
            flash("Registro exitoso. Ya puedes iniciar sesión.", "success")
            return redirect(url_for("auth.login"))
        except Exception as e:
            db.session.rollback()
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
            db.session.commit()
        except Exception as e:
            flash(f"Error al crear cliente en Stripe: {str(e)}", "danger")
            return redirect(url_for("suscripcion"))
    else:
        try:
            customer = stripe.Customer.retrieve(user.stripe_customer_id)
        except Exception as e:
            flash(f"Error al recuperar cliente de Stripe: {str(e)}", "danger")
            return redirect(url_for("suscripcion"))

    # Crear sesión de Checkout
    try:
        session_stripe = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": "price_1OaxhGAhf7qybv3y5EO168s3",  # ID de tu producto
                "quantity": 1,
            }],
            mode="subscription",
            success_url="https://pro.nubeclinic.com/panel",
            cancel_url="https://pro.nubeclinic.com/auth/suscripcion",
        )
        return redirect(session_stripe.url, code=303)
    except Exception as e:
        flash(f"Error al crear sesión de pago: {str(e)}", "danger")
        return redirect(url_for("suscripcion"))

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
            from datetime import datetime, timedelta
            user.suscripcion_activa_desde = datetime.utcnow()
            # Asumiendo una suscripción mensual
            user.suscripcion_expira = datetime.utcnow() + timedelta(days=30)
            db.session.commit()
    
    # Evento de cancelación o expiración
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.tiene_suscripcion = False
            db.session.commit()

    return "OK", 200

@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("Has cerrado sesión correctamente", "info")
    return redirect(url_for("index"))

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