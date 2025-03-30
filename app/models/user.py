from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Profile fields
    profile_image = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    consultation_price = db.Column(db.Float, nullable=True)
    consultation_duration = db.Column(db.Integer, nullable=True)  # in minutes
    languages = db.Column(db.String(255), nullable=True)
    education = db.Column(db.Text, nullable=True)
    experience = db.Column(db.Text, nullable=True)
    
    # Stripe subscription fields
    stripe_customer_id = db.Column(db.String(255), nullable=True)
    tiene_suscripcion = db.Column(db.Boolean, default=False)
    suscripcion_activa_desde = db.Column(db.DateTime, nullable=True)
    suscripcion_expira = db.Column(db.DateTime, nullable=True)
    
    # Settings and preferences
    notifications_enabled = db.Column(db.Boolean, default=True)
    calendar_sync_enabled = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    @property
    def full_name(self):
        return f"{self.name} {self.surname}"
    
    @property
    def is_active(self):
        return True
    
    @property
    def is_authenticated(self):
        return True
    
    @property
    def is_anonymous(self):
        return False
    
    def get_id(self):
        return str(self.id)