from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import os
from llm_router import get_llm_classification
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

app = FastAPI(title="AI Email Classifier API")

# Setup CORS - restrict origins in production
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_raw:
    allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained Naive Bayes Model
model_path = os.path.join("data", "spam_classifier_model.pkl")
if os.path.exists(model_path):
    ml_model = joblib.load(model_path)
else:
    ml_model = None
    print("Warning: ML model not found. Run train_model.py first.")

class EmailRequest(BaseModel):
    text: str

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "IntelliMail AI Backend API"}

@app.post("/analyze")
async def analyze_email(request: EmailRequest, x_internal_key: str = Header(None)):
    # Check shared token authorization if configured in environment
    internal_key_env = os.getenv("INTERNAL_API_KEY")
    if internal_key_env:
        if not x_internal_key or x_internal_key != internal_key_env:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access: Invalid or missing X-Internal-Key header."
            )

    email_text = request.text
    
    # --- PHASE 1: Traditional ML Classification ---
    ml_prediction = "UNKNOWN"
    
    if ml_model:
        # Predict probability: 0 refers to Ham, 1 refers to Spam
        probs = ml_model.predict_proba([email_text])[0]
        if probs[1] > 0.6:  # Over 60% confidence it is Spam
            ml_prediction = "SPAM"
        else:
            ml_prediction = "NOT_SPAM"
            
    # --- PHASE 2: LLM Deep Analysis & Priority ---
    # We call the Gemini API to get deep context, priority, and reasoning
    llm_analysis = get_llm_classification(email_text)
    
    # HYBRID LOGIC: 
    final_classification = llm_analysis.get("classification", "UNKNOWN")
    
    return {
        "text": email_text,
        "ml_classification": ml_prediction,
        "llm_classification": final_classification,
        "final_priority": llm_analysis.get("priority", "LOW"),
        "reasoning": llm_analysis.get("reasoning", "No reason provided.")
    }

# Mount the static directory to serve the legacy frontend if needed
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static", html=True), name="static")

