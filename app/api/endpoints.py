from fastapi import APIRouter,UploadFile,File
from starlette.websockets import WebSocket

from app.schema.UserResponse import UserResponse
from app.service import UserService
from app.service.recognition import face_recognition_ws, register_face, update_face,test_register,test_face_recognition_image

router = APIRouter(
    prefix="/api/authentication",
    tags=["authentication"],
    responses={404: {"description": "Not found"}},
)

@router.get("/users", response_model=list[UserResponse])
async def get_users():
  return UserService.get_all_users()

@router.get("/user-data/{id_user}")
async def get_data_use(id_user: int):
    return UserService.get_data_user_by(id_user)

@router.websocket("/ws/login/{id_user}")
async def login(websocket: WebSocket, id_user: int):
    await face_recognition_ws(websocket, id_user)

@router.post("/register")
async def register_face_endpoint(file: UploadFile = File(...)):
    return await register_face(file)
@router.post("/test/register")
async def test_register_face_endpoint(file: UploadFile = File(...)):
    return await test_register(file)
@router.post("/test/login/{code}")
async def test_register_face_endpoint(code:str,file: UploadFile = File(...)):
    return await test_face_recognition_image(code,file)

@router.post("/update/{id_user}")
async def register_face_endpoint(id_user:int,file: UploadFile = File(...)):
    return await update_face(id_user,file)