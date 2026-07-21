import os
import io
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from pypdf import PdfReader
from mistralai import Mistral

# ---------------------------------------------------------
# App Initialization & Security Setup
# ---------------------------------------------------------
app = FastAPI(
    title="Novexa AI - Powered by Mistral",
    description="All-in-One Engine using Mistral AI",
    version="4.0"
)

# CORS middleware for open requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Check
MISTRAL_KEY = os.getenv("MISTRAL_API_KEY", "")
client = Mistral(api_key=MISTRAL_KEY) if MISTRAL_KEY else None

# Models Definition
TEXT_MODEL = "mistral-small-latest"
VISION_MODEL = "pixtral-12b-2409"  # Mistral's Multimodal/Vision Model

# Helper function to check API key
def verify_client():
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="MISTRAL_API_KEY is missing! Please set it in Vercel Environment Variables."
        )

# ---------------------------------------------------------
# 1. API Endpoints
# ---------------------------------------------------------

class ChatRequest(BaseModel):
    prompt: str
    system_instruction: str = "You are Novexa AI, an advanced and intelligent assistant powered by Mistral AI."

@app.post("/api/v1/chat")
async def chat_and_code(req: ChatRequest):
    """Text Generation, Coding & Logic Tasks"""
    verify_client()
    try:
        response = client.chat.complete(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": req.system_instruction},
                {"role": "user", "content": req.prompt}
            ]
        )
        return {"status": "success", "result": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mistral Chat Error: {str(e)}")

@app.post("/api/v1/document-qa")
async def analyze_pdf(
    file: UploadFile = File(...), 
    user_query: str = Form("Summarize the main points of this document.")
):
    """Document Intelligence (PDF / Text)"""
    verify_client()
    try:
        content_bytes = await file.read()
        extracted_text = ""
        if file.filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(content_bytes))
            for page in reader.pages:
                extracted_text += page.extract_text() or ""
        else:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")

        prompt = f"Document Context:\n{extracted_text[:12000]}\n\nUser Question: {user_query}"
        
        response = client.chat.complete(
            model=TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        return {"status": "success", "filename": file.filename, "result": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document Error: {str(e)}")

@app.post("/api/v1/vision-analysis")
async def analyze_image(
    file: UploadFile = File(...), 
    prompt: str = Form("Describe this image in detail.")
):
    """Vision OCR and Image Understanding (Pixtral Model)"""
    verify_client()
    try:
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        mime_type = file.content_type or "image/jpeg"

        response = client.chat.complete(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": f"data:{mime_type};base64,{base64_image}"
                        }
                    ]
                }
            ]
        )
        return {"status": "success", "result": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision Error: {str(e)}")

class ImageGenRequest(BaseModel):
    prompt: str

@app.post("/api/v1/generate-image")
async def generate_image(req: ImageGenRequest):
    """AI Image Generation Integration"""
    try:
        encoded_prompt = req.prompt.replace(" ", "%20")
        generated_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
        return {"status": "success", "image_url": generated_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image Gen Error: {str(e)}")

# ---------------------------------------------------------
# 2. Web UI Interface (Root Endpoint)
# ---------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novexa AI - Mistral Edition</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            body { background: #0f172a; color: #f8fafc; display: flex; height: 100vh; overflow: hidden; }
            .sidebar { width: 260px; background: #1e293b; padding: 20px; display: flex; flex-direction: column; gap: 15px; border-right: 1px solid #334155; }
            .sidebar h1 { font-size: 20px; color: #f97316; text-align: center; margin-bottom: 20px; font-weight: bold; }
            .nav-btn { background: #334155; color: #f8fafc; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; text-align: left; font-size: 15px; font-weight: 500; transition: 0.2s; }
            .nav-btn:hover, .nav-btn.active { background: #ea580c; color: #fff; }
            .main-content { flex: 1; padding: 30px; overflow-y: auto; display: flex; flex-direction: column; align-items: center; }
            .card { background: #1e293b; border-radius: 12px; padding: 25px; width: 100%; max-width: 800px; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
            .card h2 { margin-bottom: 15px; color: #f97316; }
            textarea, input[type="text"], input[type="file"] { width: 100%; padding: 12px; border-radius: 8px; background: #0f172a; border: 1px solid #334155; color: #fff; margin-bottom: 15px; font-size: 14px; }
            textarea { resize: vertical; min-height: 110px; }
            button.submit-btn { background: #ea580c; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; width: 100%; transition: 0.2s; }
            button.submit-btn:hover { background: #c2410c; }
            .output-box { background: #0f172a; border-radius: 8px; padding: 15px; margin-top: 15px; border: 1px solid #334155; white-space: pre-wrap; font-size: 14px; color: #e2e8f0; min-height: 60px; word-break: break-word; }
            .output-box img { max-width: 100%; border-radius: 8px; margin-top: 10px; }
            .tab-panel { display: none; width: 100%; max-width: 800px; }
            .tab-panel.active { display: block; }
        </style>
    </head>
    <body>

        <div class="sidebar">
            <h1>🚀 Novexa AI</h1>
            <button class="nav-btn active" onclick="switchTab('chat')">💬 Chat & Coding</button>
            <button class="nav-btn" onclick="switchTab('doc')">📄 PDF / Doc QA</button>
            <button class="nav-btn" onclick="switchTab('vision')">👁️ Vision Analysis</button>
            <button class="nav-btn" onclick="switchTab('image')">🎨 Image Generator</button>
        </div>

        <div class="main-content">
            
            <!-- Chat Panel -->
            <div id="chat" class="tab-panel active">
                <div class="card">
                    <h2>Mistral Text & Code Assistant</h2>
                    <textarea id="chatInput" placeholder="Write code, ask questions, or create content..."></textarea>
                    <button class="submit-btn" onclick="handleChat()">Run Request</button>
                    <div id="chatOutput" class="output-box">Response will appear here...</div>
                </div>
            </div>

            <!-- PDF Panel -->
            <div id="doc" class="tab-panel">
                <div class="card">
                    <h2>Document QA & Summarizer</h2>
                    <input type="file" id="docFile" accept=".pdf,.txt">
                    <input type="text" id="docPrompt" placeholder="Question about document (Optional)...">
                    <button class="submit-btn" onclick="handleDoc()">Analyze Document</button>
                    <div id="docOutput" class="output-box">Response will appear here...</div>
                </div>
            </div>

            <!-- Vision Panel -->
            <div id="vision" class="tab-panel">
                <div class="card">
                    <h2>Pixtral Vision Engine</h2>
                    <input type="file" id="visionFile" accept="image/*">
                    <input type="text" id="visionPrompt" placeholder="What should I explain in this image?">
                    <button class="submit-btn" onclick="handleVision()">Analyze Image</button>
                    <div id="visionOutput" class="output-box">Response will appear here...</div>
                </div>
            </div>

            <!-- Image Gen Panel -->
            <div id="image" class="tab-panel">
                <div class="card">
                    <h2>AI Image Generator</h2>
                    <input type="text" id="imgPrompt" placeholder="Describe the image you want to generate...">
                    <button class="submit-btn" onclick="handleImageGen()">Generate Image</button>
                    <div id="imgOutput" class="output-box">Response will appear here...</div>
                </div>
            </div>

        </div>

        <script>
            function switchTab(tabId) {
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                event.target.classList.add('active');
            }

            async function handleChat() {
                const prompt = document.getElementById('chatInput').value;
                const out = document.getElementById('chatOutput');
                out.innerText = "Processing via Mistral...";
                try {
                    const res = await fetch('/api/v1/chat', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({prompt})
                    });
                    const data = await res.json();
                    out.innerText = data.result || data.detail;
                } catch(e) { out.innerText = "Error calling API."; }
            }

            async function handleDoc() {
                const file = document.getElementById('docFile').files[0];
                const prompt = document.getElementById('docPrompt').value;
                const out = document.getElementById('docOutput');
                if(!file) return alert("Select a document first.");
                out.innerText = "Processing document...";
                const formData = new FormData();
                formData.append('file', file);
                if(prompt) formData.append('user_query', prompt);
                try {
                    const res = await fetch('/api/v1/document-qa', { method: 'POST', body: formData });
                    const data = await res.json();
                    out.innerText = data.result || data.detail;
                } catch(e) { out.innerText = "Error analyzing document."; }
            }

            async function handleVision() {
                const file = document.getElementById('visionFile').files[0];
                const prompt = document.getElementById('visionPrompt').value;
                const out = document.getElementById('visionOutput');
                if(!file) return alert("Select an image first.");
                out.innerText = "Analyzing with Pixtral Model...";
                const formData = new FormData();
                formData.append('file', file);
                if(prompt) formData.append('prompt', prompt);
                try {
                    const res = await fetch('/api/v1/vision-analysis', { method: 'POST', body: formData });
                    const data = await res.json();
                    out.innerText = data.result || data.detail;
                } catch(e) { out.innerText = "Error analyzing image."; }
            }

            async function handleImageGen() {
                const prompt = document.getElementById('imgPrompt').value;
                const out = document.getElementById('imgOutput');
                out.innerText = "Generating Image...";
                try {
                    const res = await fetch('/api/v1/generate-image', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({prompt})
                    });
                    const data = await res.json();
                    if(data.image_url) {
                        out.innerHTML = `<img src="${data.image_url}" alt="Generated Image">`;
                    } else { out.innerText = data.detail; }
                } catch(e) { out.innerText = "Error generating image."; }
            }
        </script>
    </body>
    </html>
    """
