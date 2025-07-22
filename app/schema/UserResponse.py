from pydantic import BaseModel


class UserResponse(BaseModel):
    code_user : str
    state : str
    last_access : str
    logins : int

    def to_json(self):
        return {
            "code_user" : self.code_user,
            "state" : self.state,
            "last_access" : self.last_access,
            "logins" : self.logins
        }