from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
DATABASE_URL = "mysql+pymysql://root:123456@localhost:3307/miusuario"
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_connection():
    try:
        return engine.connect()
    except SQLAlchemyError as e:
        print("Error al conectarse a la bd"+e)
        raise

def close_connection(connection):
    connection.close()

def get_session():
    return SessionLocal()