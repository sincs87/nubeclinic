from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from app import db

dashboard = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@dashboard.route('/')
@login_required
def home():
    """Página principal del dashboard."""
    # Verificar si el usuario tiene una suscripción activa
    if not current_user.has_active_subscription():
        flash('No tienes una suscripción activa. Por favor, suscríbete para acceder a la plataforma.', 'warning')
        return redirect(url_for('auth.payment', user_id=current_user.id))
    
    return render_template('dashboard/home.html', title='Dashboard')

@dashboard.route('/profile')
@login_required
def profile():
    """Perfil del usuario."""
    return render_template('dashboard/profile.html', title='Mi Perfil')