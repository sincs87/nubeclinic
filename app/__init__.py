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
    
    # Create a route for the landing page
    from flask import render_template
    
    @app.route('/')
    def index():
        return render_template('landing.html')
    
    @app.route('/precios')
    def precios():
        return render_template('precios.html')
    
    @app.route('/suscripcion')
    def suscripcion():
        return render_template('suscripcion.html')
    
    return app