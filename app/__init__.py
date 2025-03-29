from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp)

    @app.route("/")
    def index():
        return render_template("landing.html")
    @app.route("/panel")
    def panel():
        return "<h2>Bienvenida al panel, profesional</h2>"
    return app
