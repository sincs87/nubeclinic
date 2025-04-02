from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp)
    
    from app.panel.routes import panel_bp
    app.register_blueprint(panel_bp)
    
    # Importar blueprint de main routes
    from app.main.routes import main_bp
    app.register_blueprint(main_bp)
    
    return app

from flask_mail import Mail
from config import Config

mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    mail.init_app(app)

    # Resto de inicializaciones: db, blueprints, etc.
    return app
