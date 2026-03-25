import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load env variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in the .env file")

genai.configure(api_key=GEMINI_API_KEY)
# We use gemini-1.5-flash as it's the recommended model for general text tasks
model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})

def get_llm_classification(email_text: str):
    """
    Passes the email text to Gemini to determine Spam/Ham, Priority, and reasoning.
    It strictly returns a JSON dictionary.
    """
    prompt = f"""
    You are an intelligent email analyzer. Analyze the following email text.
    
    Email Text:
    "{email_text}"
    
    Your task:
    1. Determine if this email is "SPAM" or "NOT_SPAM".
    2. Determine the Priority Level of this email: "HIGH", "MEDIUM", or "LOW". 
       - HIGH priority means urgent action required, emergencies, important dates/deadlines.
       - MEDIUM means action required but not immediate, general work updates.
       - LOW means informational, newsletters, casual conversations, or spam.
    3. Provide a brief reasoning (1-2 sentences) for why you chose that classification and priority.
    
    You must strictly return a JSON object with this exact schema:
    {{
        "classification": "SPAM" or "NOT_SPAM",
        "priority": "HIGH" or "MEDIUM" or "LOW",
        "reasoning": "your reasoning string here"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {
            "classification": "UNKNOWN",
            "priority": "LOW",
            "reasoning": "Failed to analyze with LLM."
        }
