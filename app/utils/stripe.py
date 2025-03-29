import stripe
import os

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

def tiene_suscripcion_activa(stripe_customer_id):
    try:
        suscripciones = stripe.Subscription.list(customer=stripe_customer_id, status="active")
        return len(suscripciones.data) > 0
    except Exception as e:
        print("Error consultando suscripción:", e)
        return False
