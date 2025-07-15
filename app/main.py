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
    return FileResponse("app/static/index.html")
@app.get("/update-view")
async def register():
    return FileResponse("app/static/update.html")
@app.get("/dashboard")
async def register():
    return FileResponse("app/static/dashboard.html")

@app.get("/test")
async def register():
    return FileResponse("app/static/api-test.html")

@app.get("/landing-page")
async def register():
    return FileResponse("app/static/landing-page.html")

