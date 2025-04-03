from flask import Blueprint, render_template, request, jsonify
from app import db
from app.models.paciente import Paciente

pacientes_bp = Blueprint("pacientes", __name__, url_prefix="/pacientes")

@pacientes_bp.route("/", methods=["GET"])
def lista_pacientes():
    pacientes = Paciente.query.order_by(Paciente.creado_en.desc()).all()
    return render_template("pacientes.html", pacientes=pacientes)

@pacientes_bp.route("/crear", methods=["POST"])
def crear_paciente():
    data = request.get_json()
    nuevo = Paciente(
        nombre=data["nombre"],
        apellidos=data["apellidos"],
        telefono=data.get("telefono"),
        email=data.get("email"),
        tipo_paciente=data.get("tipo_paciente", "Privado")
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"success": True})
