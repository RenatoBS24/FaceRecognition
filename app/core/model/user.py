from sqlalchemy import Column, Integer, String, LargeBinary, Enum, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__:str = "user"
    idUser = Column("id_user",Integer, primary_key=True)
    encode = Column(LargeBinary)
    state = Column("state",Enum('ACTIVE', 'INACTIVE', name='state_enum'))
    last_access = Column("last_access",DateTime)
    logins = Column("logins",Integer)
    code = Column("code",String(8))
    __table_args__ = {'extend_existing': True,}