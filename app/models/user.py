from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import ARRAY
from werkzeug.security import generate_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    clinic_name = db.Column(db.String(200), nullable=True)
    specialties = db.Column(ARRAY(db.String(100)), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    country_code = db.Column(db.String(5), nullable=False, default="+34")
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    stripe_customer_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tiene_suscripcion = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tenant_id = db.Column(db.String(36), nullable=False)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiration = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<User {self.email}>'
    
    @property
    def full_name(self):
        return f"{self.name} {self.surname}"
    
    @property
    def display_name(self):
        return self.clinic_name if self.clinic_name else self.full_name
    
    @property
    def primary_specialty(self):
        return self.specialties[0] if self.specialties else ""
    
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

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
