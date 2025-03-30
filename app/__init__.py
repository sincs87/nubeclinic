from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
import os

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
    
    from app.main.routes import main_bp
    app.register_blueprint(main_bp)
    
    return app