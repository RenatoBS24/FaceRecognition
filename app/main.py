from fastapi import FastAPI
from app.api.endpoints import router
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
app = FastAPI()

app.include_router(router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
async def root():
    return FileResponse("app/static/login.html")

@app.get("/register")
async def register():
    return FileResponse("app/static/register.html")
@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
