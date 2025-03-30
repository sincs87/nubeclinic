from flask import Blueprint, render_template

main_bp = Blueprint("main", __name__)

@main_bp.route('/')
def index():
    return render_template('landing.html')

@main_bp.route('/precios')
def precios():
    return render_template('precios.html')

@main_bp.route('/suscripcion')
def suscripcion():
    return render_template('suscripcion.html')