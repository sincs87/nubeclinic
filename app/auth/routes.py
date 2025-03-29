from flask import Blueprint, render_template, request, redirect, url_for, session
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
            session["user_id"] = str(user.id)
            return redirect(url_for("panel.panel_inicio"))
        else:
            error = "Credenciales incorrectas"

    return render_template("login.html", error=error)
import stripe
import os

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

@auth_bp.route("/crear-suscripcion")
def crear_suscripcion():
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("auth.login"))

    user = db.session.get(User, user_id)

    # Crear cliente en Stripe si no existe
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.name,
        )
        user.stripe_customer_id = customer.id
        db.session.commit()
    else:
        customer = stripe.Customer.retrieve(user.stripe_customer_id)

    # Crear sesión de Checkout
    session_stripe = stripe.checkout.Session.create(
        customer=customer.id,
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
from flask import request

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
            user.tiene_suscripcion = True  # Este campo debes tenerlo en la tabla
            db.session.commit()

    return "OK", 200
