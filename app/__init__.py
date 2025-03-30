from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    
    # Register blueprints
    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp)
    
    from app.panel.routes import panel_bp
    app.register_blueprint(panel_bp)
    
    from app.main.routes import main_bp
    app.register_blueprint(main_bp)
    
    return app

from app.models.user import User

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, user_id)