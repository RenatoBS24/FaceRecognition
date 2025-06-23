from sqlalchemy import Column, Integer, String,LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__:str = "usuario"
    idUser = Column("id_usuario",Integer, primary_key=True)
    password = Column("clave",String(50))
    username = Column("nombre_usuario",String(70))
    encode = Column(LargeBinary)
    __table_args__ = {'extend_existing': True,}