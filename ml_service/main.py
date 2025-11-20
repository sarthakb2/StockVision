from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# Import the updated module
import model_logic

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "Server is running", "message": "Welcome to Stock Vision API"}

# --- Configure CORS ---
origins = [
    "http://localhost:3000", # React
    "http://localhost:5000", # Node/Express
    "http://localhost:8080",
    "https://stock-vision-sage.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StockRequest(BaseModel):
    stock_name: str

@app.post("/predict")
async def get_prediction(request: StockRequest):
    if not request.stock_name:
        raise HTTPException(status_code=400, detail="Stock name is required")

    # Call the prediction logic
    result = model_logic.get_stock_prediction(request.stock_name)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result

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