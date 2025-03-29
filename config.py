import os

class Config:
    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "clave_segura_dev")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
