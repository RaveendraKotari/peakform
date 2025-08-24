ChatGPT said:

Great 👍 here’s a clean README.md you can drop into your project root.

# 📄 AI Resume Parser – Full Stack Setup

## 🔹 Overview
This project is a **full-stack AI-powered resume parser** that can read `.pdf`, `.docx`, and `.txt` resumes and return structured JSON with **Name, Email, Phone, and Skills**.  

It is built using:
- **React** → Frontend (file upload & UI)  
- **Node.js (Express)** → Backend for business logic & API gateway  
- **Python (FastAPI)** → AI microservice for resume parsing (PDF, DOCX, TXT)  

---

## 🔹 Project Structure


projects/
├── python/
│ └── ai_service/
│ └── main.py # FastAPI AI microservice
├── node/
│ └── server.js # Node.js API gateway
└── react/
└── App.jsx # React frontend


---

## 🔹 1. Python AI Microservice

### 1.1 Setup Environment
```powershell
cd projects\python\ai_service
py -m venv venv
venv\Scripts\activate

1.2 Install Dependencies
py -m pip install fastapi uvicorn python-multipart pdfplumber python-docx spacy
py -m spacy download en_core_web_sm

1.3 FastAPI Service (main.py)
from fastapi import FastAPI, UploadFile, File
from typing import Dict
import pdfplumber, docx, spacy, re, io

app = FastAPI()
nlp = spacy.load("en_core_web_sm")

def extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join([page.extract_text() or "" for page in pdf.pages])
    elif filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs])
    else:
        return file_bytes.decode("utf-8", errors="ignore")

def parse_resume(text: str) -> Dict:
    doc = nlp(text)
    name = next((ent.text for ent in doc.ents if ent.label_ == "PERSON"), None)
    if not name:
        first_line = text.strip().split("\n")[0]
        name = " ".join(first_line.split()[:2]) if first_line else "Unknown"
    email = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", text)
    phone = re.search(r"\+?\d[\d\s-]{8,}\d", text)
    known_skills = ["Python", "Java", "C++", "SQL", "React", "Node.js", "FastAPI", "Django"]
    skills = [skill for skill in known_skills if skill.lower() in text.lower()]
    return {
        "name": name,
        "email": email.group(0) if email else "Not found",
        "phone": phone.group(0) if phone else "Not found",
        "skills": skills or ["Not found"]
    }

@app.post("/resume/parse")
async def parse_resume_api(file: UploadFile = File(...)) -> Dict:
    file_bytes = await file.read()
    text = extract_text(file_bytes, file.filename)
    result = parse_resume(text)
    return {"parsed_resume": result}

1.4 Run FastAPI Server
py -m uvicorn main:app --reload --port 8001


Docs available at → http://127.0.0.1:8001/docs

🔹 2. Node.js Backend (Express)
2.1 Install Dependencies
npm init -y
npm install express multer node-fetch form-data cors

2.2 Node.js API Gateway (server.js)
import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import cors from "cors";

const app = express();
const upload = multer();

app.use(cors({ origin: "http://localhost:5173" }));

app.post("/api/resume/parse", upload.single("file"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const response = await fetch("http://127.0.0.1:8001/resume/parse", {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    const data = await response.json();
    res.json({ fromNode: true, aiResponse: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI service not reachable" });
  }
});

app.listen(3000, () => console.log("Node.js API running at http://localhost:3000"));


Run:

node server.js

🔹 3. React Frontend
3.1 File Upload Component (App.jsx)
import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:3000/api/resume/parse", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div>
      <h1>Resume Parser</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Upload & Parse</button>
      </form>
      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;


Run React:

npm run dev

🔹 4. Testing

Start FastAPI:

py -m uvicorn main:app --reload --port 8001


Start Node.js:

node server.js


Start React (Vite/CRA):

npm run dev


Open React app → Upload a .pdf, .docx, or .txt resume.

🔹 5. Example Output

Input resume:

John Doe
Email: johndoe@example.com
Phone: +1-202-555-0147
Skills: Python, SQL, React
Experience: 3 years at Google as Software Engineer


Output JSON:

{
  "fromNode": true,
  "aiResponse": {
    "parsed_resume": {
      "name": "John Doe",
      "email": "johndoe@example.com",
      "phone": "+1-202-555-0147",
      "skills": ["Python", "SQL", "React"]
    }
  }
}