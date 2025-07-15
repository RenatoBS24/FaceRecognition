from pydantic import BaseModel


class UserResponse(BaseModel):
    state : str
    last_access : str
    logins : int

    def to_json(self):
        return {
            "state" : self.state,
            "last_access" : self.last_access,
            "logins" : self.logins
        }