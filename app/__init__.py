from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    # Importar blueprints
    from app.auth.routes import auth_bp
    from app.panel.routes import panel_bp

    # Registrar blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(panel_bp)

    # Ruta principal (landing)
    @app.route("/")
    def index():
        return render_template("landing.html")
    @app.route("/precios")
    def precios():
        return render_template("precios.html")


    return app
