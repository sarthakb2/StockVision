from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import torch

# --- 1. Auto-Detect Device ---
# If CUDA (Nvidia GPU) is available, use it. Otherwise, use CPU.
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"🚀 Running on: {device}")  # This will print 'cpu' on Render logs

# --- 2. Load Model Safely ---
# 'map_location=device' is the magic part.
# It prevents the "CUDA error" by remapping GPU weights to CPU when needed.
try:
    model = YourModelClass()  # Replace with your actual model class instantiation
    model.load_state_dict(torch.load("model.pth", map_location=device))
    model.to(device)  # Move the actual model to the correct hardware
    model.eval()
except Exception as e:
    print(f"Error loading model: {e}")


# --- 3. Use 'device' in your prediction endpoint ---
@app.post("/predict")
async def predict(input_data: StockInput):
    # ... your existing preprocessing code ...

    # When converting data to tensors, send them to the device
    inputs = torch.tensor(processed_data).float().to(device)

    with torch.no_grad():
        outputs = model(inputs)

    # If you need to convert output back to numpy for JSON response:
    prediction = outputs.cpu().numpy()  # .cpu() is required before .numpy()

    # ... rest of your return logic ...


# Import the updated module
import model_logic

app = FastAPI()


@app.get("/")
def read_root():
    return {"status": "Server is running", "message": "Welcome to Stock Vision API"}


# --- Configure CORS ---
origins = [
    "http://localhost:3000",  # React
    "http://localhost:5000",  # Node/Express
    "http://localhost:8080",
    "https://stock-vision-sage.vercel.app",
    "https://stock-vision-5sxq0se2r-sarthaks-projects-c5b597d0.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
