from app import db
import uuid
from datetime import datetime

class Paciente(db.Model):
    __tablename__ = "pacientes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    dni = db.Column(db.String(20), nullable=True)
    tipo_paciente = db.Column(db.String(20), nullable=False, default="Privado")
    autorizacion = db.Column(db.String(20), nullable=True, default="Aceptado")
    
    # Historial de visitas
    ultima_visita = db.Column(db.DateTime, nullable=True)
    siguiente_visita = db.Column(db.DateTime, nullable=True)
    
    # Campo para la multi-tenencia
    tenant_id = db.Column(db.String(36), nullable=False)
    
    # Campos de auditoría
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    creado_por = db.Column(db.String(36), nullable=True)
    actualizado_en = db.Column(db.DateTime, nullable=True)
    actualizado_por = db.Column(db.String(36), nullable=True)
    eliminado = db.Column(db.Boolean, default=False)
    eliminado_en = db.Column(db.DateTime, nullable=True)
    eliminado_por = db.Column(db.String(36), nullable=True)
    
    def __repr__(self):
        return f'<Paciente {self.nombre} {self.apellidos}>'
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellidos}"
    
    # Método para serializar el objeto a JSON
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'apellidos': self.apellidos,
            'nombre_completo': self.nombre_completo,
            'telefono': self.telefono,
            'email': self.email,
            'dni': self.dni,
            'tipo_paciente': self.tipo_paciente,
            'autorizacion': self.autorizacion,
            'ultima_visita': self.ultima_visita.isoformat() if self.ultima_visita else None,
            'siguiente_visita': self.siguiente_visita.isoformat() if self.siguiente_visita else None
        }