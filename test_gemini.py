import json
import traceback
from llm_router import get_llm_classification

try:
    print("Testing get_llm_classification...")
    result = get_llm_classification("URGENT: Server is down")
    print(json.dumps(result, indent=2))
except Exception as e:
    print("Caught exception at top level:")
    traceback.print_exc()

import llm_router
# Also let's monkey patch it to raise instead of swallow
def get_llm_raising(email_text):
    prompt = f"..."
    response = llm_router.model.generate_content("hello")
    return response.text

print("Testing direct generate_content...")
try:
    print(get_llm_raising("test"))
except Exception as e:
    traceback.print_exc()
