from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db, login_manager

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionar con la suscripción
    subscription = db.relationship('Subscription', backref='user', uselist=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def has_active_subscription(self):
        if self.subscription and self.subscription.is_active:
            return True
        return False
    
    def __repr__(self):
        return f'<User {self.email}>'

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Información básica de la suscripción
    plan_name = db.Column(db.String(50), default="Plan Básico")
    price = db.Column(db.Float, default=49.99)
    is_active = db.Column(db.Boolean, default=True)
    
    # Fechas importantes
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    
    # Información de Stripe
    stripe_customer_id = db.Column(db.String(100))
    stripe_subscription_id = db.Column(db.String(100))
    
    def __repr__(self):
        status = "Activa" if self.is_active else "Inactiva"
        return f'<Subscription {self.plan_name} - {status}>'