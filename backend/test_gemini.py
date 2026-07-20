from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

print("API Key starts with:", os.getenv("GEMINI_API_KEY")[:5])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    response = client.models.generate_content(
        model="gemini-flash-lite-latest",
        contents="Say Hello"
    )
    print(response.text)

except Exception as e:
    import traceback
    traceback.print_exc()