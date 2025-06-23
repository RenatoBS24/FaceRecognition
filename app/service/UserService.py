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