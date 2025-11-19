#!/bin/bash
echo "--- Setting up Stock Vision Environment ---"

# 1. Create Virtual Environment
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

# 2. Activate and Install
echo "Activating environment and installing libraries..."
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "--- SUCCESS! ---"
echo "To run the server, type: python -m uvicorn main:app --reload"