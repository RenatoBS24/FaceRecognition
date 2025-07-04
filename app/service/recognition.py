from deepface import DeepFace
from fastapi import HTTPException
from starlette.websockets import WebSocket

from app.service import UserService
import cv2
import numpy as np



async def face_recognition_ws(websocket: WebSocket, id_user: int):
    await websocket.accept()
    while True:
        try:
            image = await websocket.receive_bytes()
            array_np = np.frombuffer(image, dtype=np.uint8)
            img = cv2.imdecode(array_np, cv2.IMREAD_COLOR)
            try:
                embedding = DeepFace.represent(img_path=img, enforce_detection=True)[0]["embedding"]
                UserService.register_embedding(id_user, embedding)
                await websocket.send_text("Registro exitoso")
            except Exception as e:
                await websocket.send_text(f"Error: No se detectó rostro: {str(e)}")
        except Exception as e:
            await websocket.send_text(f"Error de conexión: {str(e)}")
            break





def face_recognition(id_user:int,image:bytes):
    array_np = np.frombuffer(image, dtype=np.uint8)
    img = cv2.imdecode(array_np, cv2.IMREAD_COLOR)
    try:
        embedding = DeepFace.represent(img_path=img, enforce_detection=True)[0]["embedding"]
        UserService.register_embedding(id_user, embedding)
        return "Registry successful."
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se detectó rostro: {str(e)}")