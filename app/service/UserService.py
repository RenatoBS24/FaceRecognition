from ..schema.UserResponse import UserResponse
from ..core.model.user import User
from ..utils import Connection


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
    user = session.query(User).filter(User.idUser == id_user).first()
    if user:
        user.encode = embedding
        session.commit()
    session.close()