from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from config import Config


db = SQLAlchemy()
migrate = Migrate()
mail = Mail()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Inicializar extensiones
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    # Registrar blueprints
    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp)

    from app.panel.routes import panel_bp
    app.register_blueprint(panel_bp)

    from app.main.routes import main_bp
    app.register_blueprint(main_bp)

    from app.pacientes.routes import pacientes_bp
    app.register_blueprint(pacientes_bp)



    return app
