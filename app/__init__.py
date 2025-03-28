from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

# Inicializar extensiones
db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor inicia sesión para acceder a esta página.'
login_manager.login_message_category = 'warning'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Inicializar extensiones con la app
    db.init_app(app)
    login_manager.init_app(app)
    
    # Importar y registrar blueprints
    from app.auth.routes import auth
    from app.dashboard.routes import dashboard
    
    app.register_blueprint(auth)
    app.register_blueprint(dashboard)
    
    # Registrar ruta principal
    @app.route('/')
    def index():
        from flask import render_template
        return render_template('index.html')
    
    return app

# Importar modelos para que Flask-Migrate los detecte
from app.models.user import User