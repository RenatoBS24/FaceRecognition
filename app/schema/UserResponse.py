from pydantic import BaseModel


class UserResponse(BaseModel):
    username : str
    password : str