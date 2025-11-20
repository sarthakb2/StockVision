import os

# FORCE CPU ONLY - CRITICAL FOR RENDER
# This must be the very first line to prevent "CUDA Error: failed call to cuInit"
# comment this when running locally with GPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import your logic handler
import model_logic 

# Initialize the App
app = FastAPI()

# --- Configure CORS ---
# Allows your Vercel frontend to talk to this backend
origins = [
    "http://localhost:3000",
    "https://stock-vision.vercel.app",
    # Add any specific Vercel URLs here if the one above doesn't cover it
    "https://stock-vision-5sxq0se2r-sarthaks-projects-c5b597d0.vercel.app", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Keep "*" for now to ensure connection works easily
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Input Validation Class ---
class StockRequest(BaseModel):
    stock_name: str

# --- Routes ---

@app.get("/")
def read_root():
    return {"status": "Server is running", "message": "Welcome to Stock Vision API"}

@app.post("/predict")
async def get_prediction(request: StockRequest):
    if not request.stock_name:
        raise HTTPException(status_code=400, detail="Stock name is required")

    print(f"🔮 Predicting for: {request.stock_name}")

    # Call the function inside your model_logic.py file
    # This assumes model_logic.py handles the loading and prediction internally
    try:
        result = model_logic.get_stock_prediction(request.stock_name)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard")
async def get_dashboard():
    """
    Fetches live market overview, trending stocks, and news.
    """
    try:
        data = model_logic.get_dashboard_data()
        return data
    except Exception as e:
        print(f"Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))