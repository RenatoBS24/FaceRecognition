import datetime
import json

from flask import session

from ..schema.UserResponse import UserResponse
from ..core.model.user import User
from ..utils import Connection
import pickle

from ..utils.codeRamdon import generate_random_code


def get_all_users():
   session = Connection.get_session()
   users = session.query(User).all()
   session.close()
   return [

       "Hola"
   ]

def get_embedding(id_user):
    session = Connection.get_session()
    try:
        user = session.query(User).filter(User.idUser == id_user).first()
        if not user:
            session.close()
            raise ValueError(f"Usuario con ID {id_user} no encontrado")
        return pickle.loads(user.encode)
    except Exception as e:
        session.close()
        raise e


def get_data_user_by(id_user):
    session = Connection.get_session()
    try:
        user = session.query(User).filter(User.idUser == id_user).first()
        if not user:
            session.close()
            raise ValueError(f"Usuario con ID {id_user} no encontrado")
        user_response = UserResponse(
            state= user.state,
            last_access= str(user.last_access),
            logins= user.logins,
        )
        return UserResponse.to_json(user_response)
    except Exception as e:
        session.close()
        raise e


def create_user(embedding):
    session = Connection.get_session()
    try:
        new_user = User(
            encode = pickle.dumps(embedding),
            state = 'ACTIVE',
            last_access = datetime.datetime.now(),
            logins = 0,
            code = generate_random_code()
        )
        session.add(new_user)
        session.commit()
        new_code = new_user.code
        session.close()
        return new_code
    except Exception as e:
        session.rollback()
        session.close()
        raise e


def register_embedding(id_user, embedding):
    session = Connection.get_session()
    try:
        user = session.query(User).filter(User.idUser == id_user).first()
        if not user:
            session.close()
            raise ValueError(f"Usuario con ID {id_user} no encontrado")
        user.encode = pickle.dumps(embedding)
        session.commit()
        session.close()
        return True
    except Exception as e:
        session.rollback()
        session.close()
        raise e

def user_update_data_access(id_user: int):
    session = Connection.get_session()
    try:
        user = session.query(User).filter(User.idUser == id_user).first()
        if not user:
            session.close()
            raise ValueError(f"Usuario con ID {session['idUser']} no encontrado")
        user.last_access = datetime.datetime.now()
        user.logins += 1
        session.commit()
        session.close()
        return True
    except Exception as e:
        session.rollback()
        session.close()
        raise e

