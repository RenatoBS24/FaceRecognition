from fastapi import APIRouter,UploadFile,File
from starlette.websockets import WebSocket

from app.schema.UserResponse import UserResponse
from app.service import UserService
from app.service.recognition import face_recognition_ws,register_face

router = APIRouter(
    prefix="/api/authentication",
    tags=["authentication"],
    responses={404: {"description": "Not found"}},
)

@router.get("/users", response_model=list[UserResponse])
async def get_users():
  return UserService.get_all_users()

@router.websocket("/ws/login/{id_user}")
async def login(websocket: WebSocket, id_user: int):
    await face_recognition_ws(websocket, id_user)

@router.post("/register/{id_user}")
async def register_face_endpoint(id_user: int, file: UploadFile = File(...)):
    return await register_face(id_user, file)