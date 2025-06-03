# Projektų Žvalgas (Project Scout) 🏗️

An AI-powered platform for discovering public construction tenders in Lithuania.  
Built as a fun side project to revisit AI tools, practice modern web technologies, and test ideas in a week's worth of spare time.

---

## 📌 About the Project

**Projektų Žvalgas** intelligently processes construction project documents, enabling:

- 📄 **Semantic search** across public construction tenders
- 🏢 **Context-aware AI assistant** for Lithuanian construction terminology
- 📊 **Document focusing and metadata extraction**
- 🤖 AI-powered Q&A on deadlines, requirements, locations, and more

Data is processed daily, and models are optimized for fast, lightweight deployment on free-tier resources.

---

## 📦 Tech Stack

### Frontend:
- **Next.js (React)** – server-side rendering & routing
- **TypeScript** – type-safe development
- **Tailwind CSS** – modern, responsive UI
- **React Icons** – iconography
- **Axios** – API communication

### Backend:
- **Python FastAPI** – async, high-performance API
- **LangGraph** – AI workflow orchestration
- **LangChain** – semantic search & document-focused querying
- **Vector DB integration** – for document retrieval

### AI Models:
- **LLaMA 4 Scout** – answer generation
- **Gemma 2 9B** – document grading & relevance scoring  

> Built entirely in **VS Code**, with occasional help from **GitHub Copilot** 🤖

## 📁 Project Structure
/frontend       # Next.js frontend app
/backend        # FastAPI backend with LangGraph workflows
/docs           # Preprocessed tender documents (vector DB ready)
/models         # LLaMA 4 Scout & Gemma 2 configurations
/docker         # Dockerfiles and docker-compose setup


## ⚙️ Limitations & Future Improvements
This was a quick experimental build — there’s plenty of room for:

Better AI prompt engineering

Enhanced document parsing

User management and authentication

Production-ready CI/CD pipelines

Live data curation

Multi agentic retrieval

## 📅 Data & Sources

https://manobustas.lt/juridine-informacija/

Public tender documentation from Lithuanian sources

📝 License
This project is open-sourced for learning and demo purposes.
Use at your own discretion — no warranties provided.

## 🤝 Acknowledgements
Meta for LLaMA 4 Scout

Google for Gemma 2

LangChain & LangGraph teams

Next.js & FastAPI communities

GitHub Copilot for the occasional shortcut 😉

## 📬 Feedback & Contributions
Found a bug? Have an improvement idea? Feel free to:

Create an issue

Fork the project

Or just drop me a message


---

## 🔧 Features

- Semantic search across tender documentation  
- AI assistant fluent in Lithuanian construction domain  
- Metadata extraction and deep querying of specific projects  
- Lightweight, responsive frontend for a clean user experience  
- AI workflows for answer generation and document grading

---

## 🐳 Deployment Options

### Single Container:
- **Next.js API routes** handle both frontend and backend routing  
- Ideal for quick demos via tunneling (e.g. Ngrok)

### Multi-Container:
- **Separate Docker containers** for backend (FastAPI) and frontend (Next.js)
- Routing managed via inter-container networking

---

## 🚀 Quick Start (Local)

**1️⃣ Clone the repo:**

```bash
git clone https://github.com/ArturasGrygelis/Projektu-zvalgas-nextjs.git
cd Projektu-zvalgas-nextjs



## 2️⃣ Build and run single container setup:
docker build -t project-scout .
docker run -p 3000:3000 project-scout

## 3️⃣ OR use multi-container setup:
docker-compose up --build






