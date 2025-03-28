from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, current_user, login_required
from app.auth.forms import RegistrationForm, LoginForm
from app.models.user import User, Subscription
from app import db

auth = Blueprint('auth', __name__, url_prefix='/auth')

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.home'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(name=form.name.data, email=form.email.data)
        user.set_password(form.password.data)
        
        try:
            db.session.add(user)
            db.session.commit()
            flash('¡Registro exitoso! Ahora puedes suscribirte al plan.', 'success')
            return redirect(url_for('auth.payment', user_id=user.id))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al registrar usuario: {str(e)}', 'danger')
    
    return render_template('auth/register.html', title='Registro', form=form)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.home'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            flash('Has iniciado sesión correctamente', 'success')
            return redirect(next_page if next_page else url_for('dashboard.home'))
        else:
            flash('Email o contraseña incorrectos. Por favor, inténtalo de nuevo.', 'danger')
    
    return render_template('auth/login.html', title='Iniciar Sesión', form=form)

@auth.route('/logout')
def logout():
    logout_user()
    flash('Has cerrado sesión correctamente', 'success')
    return redirect(url_for('index'))

@auth.route('/payment/<int:user_id>')
def payment(user_id):
    user = User.query.get_or_404(user_id)
    
    # Si ya tiene una suscripción activa, redirigir al dashboard
    if user.has_active_subscription():
        flash('Ya tienes una suscripción activa', 'info')
        return redirect(url_for('dashboard.home'))
    
    stripe_checkout_url = current_app.config['STRIPE_CHECKOUT_URL']
    
    return render_template('auth/payment.html', 
                           title='Pago de Suscripción', 
                           user=user,
                           stripe_checkout_url=stripe_checkout_url)

@auth.route('/payment-success/<int:user_id>', methods=['GET', 'POST'])
def payment_success(user_id):
    user = User.query.get_or_404(user_id)
    
    # Crear o actualizar la suscripción
    if not user.subscription:
        subscription = Subscription(user_id=user.id)
        db.session.add(subscription)
    else:
        subscription = user.subscription
        subscription.is_active = True
    
    try:
        db.session.commit()
        flash('¡Suscripción activada correctamente!', 'success')
        # Iniciar sesión automáticamente después de la suscripción
        login_user(user)
        return redirect(url_for('dashboard.home'))
    except Exception as e:
        db.session.rollback()
        flash(f'Error al activar la suscripción: {str(e)}', 'danger')
        return redirect(url_for('auth.login'))