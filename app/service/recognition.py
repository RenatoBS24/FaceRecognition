import json
import os
import pickle
import tempfile

from deepface import DeepFace
from fastapi import HTTPException, UploadFile,File
from fastapi.responses import JSONResponse
from starlette.websockets import WebSocket, WebSocketDisconnect
from app.service import UserService
from app.utils import decode
import cv2
import numpy as np



def cosine_similarity(vec1,vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1,vec2)/(np.linalg.norm(vec1)*np.linalg.norm(vec2))


async def face_recognition_ws(websocket: WebSocket, id_user: int):
    await websocket.accept()
    processing = False
    print(f"WebSocket conectado para usuario: {id_user}")

    register_embedding = UserService.get_embedding(id_user)
    if register_embedding is None:
        await websocket.send_text(json.dumps({"error": "no hay un usuario registrado con ese id"}))
        await websocket.close()
        return
    umbral = 0.6
    try:
        while True:
            try:
                message = await websocket.receive_text()
                print("Datos recibidos del frontend")
                if processing:
                    print("Saltando frame - ya procesando")
                    continue

                processing = True
                try:
                    data = json.loads(message)
                    code = data.get('image', '')
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({"error": "Formato JSON inválido"}))
                    continue

                if not code:
                    await websocket.send_text(json.dumps({"error": "Datos vacíos"}))
                    continue
                try:
                    image = decode.decode_image_base64(message)
                    array_np = np.frombuffer(image, dtype=np.uint8)
                    img = cv2.imdecode(array_np, cv2.IMREAD_COLOR)

                    if img is None:
                        await websocket.send_text(json.dumps({"error": "Imagen inválida"}))
                        continue
                    embedding = DeepFace.represent(img_path=img, enforce_detection=False)[0]["embedding"]
                    similarity = cosine_similarity(embedding, register_embedding)
                    print("La similitud entre los rostros es: " + str(similarity) + "%")
                    if similarity > umbral:
                        await websocket.send_text(json.dumps({"successful": "Autenticacion exitosa","id_user":id_user}))
                        print(f"Autenticación exitosa para usuario {id_user}")
                        UserService.user_update_data_access(id_user)
                        await websocket.close()
                        break
                    else:
                        await websocket.send_text(json.dumps({"error": "Rostro no coincide"}))
                        await websocket.close()
                        break

                except Exception as e:
                    print(f"Error procesando DeepFace: {str(e)}")
                    await websocket.send_text(json.dumps({"error": "No se detectó rostro válido"}))

            except Exception as e:
                print(f"Error procesando mensaje: {str(e)}")
                await websocket.send_text(json.dumps({"error": f"Error interno: {str(e)}"}))
            finally:
                processing = False

    except WebSocketDisconnect:
        print(f"WebSocket desconectado para usuario: {id_user}")
    except Exception as e:
        print(f"Error crítico en WebSocket: {str(e)}")
        try:
            if not websocket.client_state.DISCONNECTED:
                await websocket.close()
        except:
            pass



async def face_recognition_ws_all(websocket: WebSocket):
    await websocket.accept()
    processing = False
    print("WebSocket conectado")

    umbral = 0.6
    try:
        while True:
            try:
                message = await websocket.receive_text()
                print("Datos recibidos del frontend")
                if processing:
                    print("Saltando frame - ya procesando")
                    continue

                processing = True
                try:
                    data = json.loads(message)
                    code = data.get('image', '')
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({"error": "Formato JSON inválido"}))
                    continue

                if not code:
                    await websocket.send_text(json.dumps({"error": "Datos vacíos"}))
                    continue
                try:
                    image = decode.decode_image_base64(message)
                    array_np = np.frombuffer(image, dtype=np.uint8)
                    img = cv2.imdecode(array_np, cv2.IMREAD_COLOR)

                    if img is None:
                        await websocket.send_text(json.dumps({"error": "Imagen inválida"}))
                        continue
                    embedding = DeepFace.represent(img_path=img, enforce_detection=False)[0]["embedding"]
                    encontrados = False
                    for id_user, register_embedding in UserService.get_all_embeddings():
                        similarity = cosine_similarity(embedding, register_embedding)
                        print(f"Similitud con usuario {id_user}: {similarity}")
                        if similarity > umbral:
                            await websocket.send_text(json.dumps({"successful": "Autenticacion exitosa", "id_user": id_user}))
                            print(f"Autenticación exitosa para usuario {id_user}")
                            UserService.user_update_data_access(id_user)
                            await websocket.close()
                            encontrados = True
                            break
                    if not encontrados:
                        await websocket.send_text(json.dumps({"error": "Rostro no coincide"}))
                        await websocket.close()
                        break

                except Exception as e:
                    print(f"Error procesando DeepFace: {str(e)}")
                    await websocket.send_text(json.dumps({"error": "No se detectó rostro válido"}))

            except Exception as e:
                print(f"Error procesando mensaje: {str(e)}")
                await websocket.send_text(json.dumps({"error": f"Error interno: {str(e)}"}))
            finally:
                processing = False

    except WebSocketDisconnect:
        print("WebSocket desconectado")
    except Exception as e:
        print(f"Error crítico en WebSocket: {str(e)}")
        try:
            if not websocket.client_state.DISCONNECTED:
                await websocket.close()
        except:
            pass

async def test_face_recognition_image(code_user: str, file:UploadFile=File(...)):
    register_embedding = UserService.get_embedding_code(code_user)
    if register_embedding is None:
        return {"error": "no hay un usuario registrado con ese id"}

    image = await file.read()
    array_np = np.frombuffer(image, dtype=np.uint8)
    img = cv2.imdecode(array_np, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "Imagen inválida"}

    try:
        embedding = DeepFace.represent(img_path=img, enforce_detection=False)[0]["embedding"]
        similarity = cosine_similarity(embedding, register_embedding)
        print("La similitud entre los rostros es: " + str(similarity))
        umbral = 0.6
        if similarity > umbral:
            return {"successful": "Autenticacion exitosa"}
        else:
            return {"error": "Rostro no coincide"}
    except Exception as e:
        print(f"Error procesando DeepFace: {str(e)}")
        return {"error": "No se detectó rostro válido"}


def is_real_face(img):
    try:
        if img is None:
            print("Imagen decodificada es None")
            return False
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            temp_path = tmp.name
        success = cv2.imwrite(temp_path, img)
        print(f"Intentando guardar imagen temporal en: {temp_path}")
        if not success:
            print("No se pudo guardar la imagen temporal")
            os.remove(temp_path)
            return False
        file_size = os.path.getsize(temp_path)
        print(f"Tamaño del archivo temporal: {file_size} bytes")
        result = DeepFace.verify(
            img1_path=temp_path,
            img2_path=temp_path,
            enforce_detection=True,
            anti_spoofing=False
        )
        print(f"Resultado DeepFace.verify: {result}")
        os.remove(temp_path)
        return result.get("verified", False)
    except Exception as e:
        print(f"Error en anti-spoofing: {str(e)}")
        return False

async def register_face(file:UploadFile=File(...)):
    try:
        content = await file.read()
        array_np = np.frombuffer(content, dtype=np.uint8)
        img = cv2.imdecode(array_np, cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse(
                status_code=400,
                content={"error_code": "invalid_image", "detail": "No se pudo procesar la imagen"}
            )

        if not is_real_face(img):
            return JSONResponse(
                status_code=400,
                content={"error_code": "spoofing_detected", "detail": "La imagen no es real"}
            )
        embedding = DeepFace.represent(img_path=img, enforce_detection=True)[0]["embedding"]
        print(f"Embedding generado: {len(embedding)} dimensiones")
        code_user = UserService.create_user(embedding)
        return {"message": "Registry successful.","code":code_user}
    except HTTPException as e:
        raise
    except Exception as e:
        print(f"Error detallado: {str(e)}")
        print(f"Tipo de error: {type(e)}")
        return JSONResponse(
            status_code=400,
            content={"error_code": "no_face_detected", "detail": f"No se detectó rostro: {str(e)}"}
        )


async def test_register(file:UploadFile=File(...)):
    response = await register_face(file)
    if response is None:
        return JSONResponse(
            status_code=400,
            content={"error_code": "invalid_image", "detail": "No se pudo procesar la imagen"}
        )
    else:
        if isinstance(response, JSONResponse):
            return JSONResponse(
                status_code=400,
                content={"error_code": "no_face_detected", "detail": f"No se detectó rostro"}
            )
        code = response.get("code")
        print(code)
        embedding = UserService.get_embedding_code(code)
        if embedding is None:
            return JSONResponse(
                status_code=400,
                content={"error_code": "invalid_code", "detail": "No se pudo procesar la imagen"}
            )
        else:
            return JSONResponse(
                status_code=200,
                content={"code":code,"encode":embedding}
            )



async def update_face(id_user:int,file:UploadFile=File(...)):
    try:
        content = await file.read()
        array_np = np.frombuffer(content, dtype=np.uint8)
        img = cv2.imdecode(array_np, cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse(
                status_code=400,
                content={"error_code": "invalid_image", "detail": "No se pudo procesar la imagen"}
            )

        if not is_real_face(img):
            return JSONResponse(
                status_code=400,
                content={"error_code": "spoofing_detected", "detail": "La imagen no es real"}
            )
        embedding = DeepFace.represent(img_path=img, enforce_detection=True)[0]["embedding"]
        print(f"Embedding generado: {len(embedding)} dimensiones")
        code_user = UserService.register_embedding(id_user,embedding)
        return {"message": "Update successful.","code":code_user}
    except HTTPException as e:
        raise
    except Exception as e:
        print(f"Error detallado: {str(e)}")
        print(f"Tipo de error: {type(e)}")
        return JSONResponse(
            status_code=400,
            content={"error_code": "no_face_detected", "detail": f"No se detectó rostro: {str(e)}"}
        )