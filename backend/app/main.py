from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, checkin, coach, profile


app = FastAPI(title="ForAthlete API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

app.include_router(checkin.router)

app.include_router(coach.router)

app.include_router(profile.router)


@app.get("/")
def read_root():
    return {"message": "ForAthlete API is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}