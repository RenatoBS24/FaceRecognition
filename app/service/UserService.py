from ..schema.UserResponse import UserResponse
from ..core.model.user import User
from ..utils import Connection
import pickle


def get_all_users():
   session = Connection.get_session()
   users = session.query(User).all()
   session.close()
   return [
       UserResponse(
           username=user.username,
           password= user.password
       )
       for user in users
   ]


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