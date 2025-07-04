from fastapi import APIRouter,UploadFile,File
from starlette.websockets import WebSocket

from app.schema.UserResponse import UserResponse
from app.service import UserService
from app.service.recognition import face_recognition_ws

router = APIRouter(
    prefix="/api/authentication",
    tags=["authentication"],
    responses={404: {"description": "Not found"}},
)

@router.get("/users", response_model=list[UserResponse])
async def get_users():
  return UserService.get_all_users()

@router.post("/login")
async def login(id:int,file : UploadFile = File(...)):
    image_bytes = await file.read()
    return {"message": "Login successful"}


@router.websocket("/ws/register/{id_user}")
async def register(websocket: WebSocket, id_user: int):
    await face_recognition_ws(websocket, id_user)