import io
import re
import docx
import pdfplumber
import pytesseract
import spacy
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from typing import Dict
from transformers import pipeline

# -----------------------------
# Load NLP + HuggingFace model
# -----------------------------
nlp = spacy.load("en_core_web_sm")
resume_parser = pipeline("text2text-generation", model="google/flan-t5-small")

app = FastAPI()

# -----------------------------
# Text Extraction
# -----------------------------
def extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            texts = []
            for page in pdf.pages:
                txt = page.extract_text()
                if not txt:  # OCR fallback for scanned pages
                    img = page.to_image().original
                    txt = pytesseract.image_to_string(img)
                texts.append(txt or "")
            return "\n".join(texts)
    elif filename.endswith(".docx"):
        document = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in document.paragraphs])
    else:  # txt or unknown
        return file_bytes.decode("utf-8", errors="ignore")

# -----------------------------
# Preprocessing
# -----------------------------
def preprocess(text: str) -> str:
    text = re.sub(r"\s+", " ", text)  # remove extra spaces/newlines
    text = text.replace("PROFESSIONAL EXPERIENCE", "EXPERIENCE")
    text = text.replace("EDUCATIONAL BACKGROUND", "EDUCATION")
    return text.strip()

# -----------------------------
# AI-based Parsing
# -----------------------------
def ai_extract(text: str) -> dict:
    prompt = f"""
Extract the following information from this resume and return valid JSON.
Always include ALL fields, even if they are empty:
- name (string)
- email (string)
- phone (string)
- skills (array of strings)
- experience (array of objects with fields: company, role, years)
- education (array of strings)

Resume Text:
{text}
"""
    try:
        result = resume_parser(prompt, max_length=512, do_sample=False)
        parsed = result[0]["generated_text"]

        if parsed.startswith("{") and parsed.endswith("}"):
            return eval(parsed)  # in prod use json.loads()
        else:
            return {}
    except Exception as e:
        print("AI extraction failed:", e)
        return {}


# -----------------------------
# Regex + spaCy Fallback Parser
# -----------------------------
def regex_spacy_parse(text: str) -> Dict:
    doc = nlp(text)

    # Try to find name (first entity PERSON)
    name = None
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text
            break

    # Regex email/phone
    email = re.search(r"[\w\.-]+@[\w\.-]+", text)
    phone = re.search(r"\+?\d[\d\-\s]{7,}\d", text)

    # Expanded Skills dictionary
    skills_list = [
        "Python", "Java", "SQL", "React", "JavaScript", "C++", "C#", ".NET",
        "Azure", "AWS", "Kubernetes", "Docker", "Tableau", "TensorFlow",
        "PyTorch", "Node.js", "Express", "HTML", "CSS", "MongoDB", "PostgreSQL"
    ]
    skills = [skill for skill in skills_list if skill.lower() in text.lower()]

    return {
        "name": name or "Unknown",
        "email": email.group(0) if email else "Not found",
        "phone": phone.group(0) if phone else "Not found",
        "skills": skills or ["Not found"]
    }


def regex_experience(text: str):
    matches = re.findall(
        r"(?:Experience|Work).*?([A-Za-z0-9 ]+)\s*[-,]\s*(.*?)(\d{4}–\d{4}|\d{4}–present)",
        text,
        re.I
    )
    results = []
    for m in matches:
        results.append({
            "company": m[0].strip(),
            "role": m[1].strip(),
            "years": m[2]
        })
    return results


def regex_education(text: str):
    matches = re.findall(
        r"(B\.Sc\.|M\.Sc\.|B\.Tech|M\.Tech|Bachelor|Master).*?\d{4}\)",
        text,
        re.I
    )
    return [m.strip() for m in matches]


# -----------------------------
# Hybrid Parser
# -----------------------------
def hybrid_parse(text: str) -> dict:
    text = preprocess(text)

    ai_data = ai_extract(text)
    regex_data = regex_spacy_parse(text)

    final = {**regex_data, **ai_data}

    # Merge skills
    ai_skills = set(ai_data.get("skills", []))
    regex_skills = set(regex_data.get("skills", []))
    final["skills"] = list(ai_skills | regex_skills)

    # Fallback for experience
    if not ai_data.get("experience"):
        final["experience"] = regex_experience(text)

    # Fallback for education
    if not ai_data.get("education"):
        final["education"] = regex_education(text)

    return final

# -----------------------------
# FastAPI Endpoint
# -----------------------------
@app.post("/resume/parse")
async def parse_resume_api(file: UploadFile = File(...)) -> Dict:
    file_bytes = await file.read()
    text = extract_text(file_bytes, file.filename)
    result = hybrid_parse(text)
    return {"parsed_resume": result}
