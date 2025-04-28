# Darbo Asistentas

An AI-powered work assistant application built with Next.js frontend and FastAPI backend, using LangGraph for AI workflows.

## Project Structure

myapp/ ├── backend/ # FastAPI backend │ ├── app/ │ │ ├── main.py # FastAPI app with endpoints │ │ ├── api/ # API routes │ │ ├── models/ # Data schemas │ │ ├── services/ # Business logic │ │ └── workflows/ # LangGraph workflows │ ├── requirements.txt │ └── Dockerfile │ ├── frontend/ # Next.js frontend │ ├── pages/ │ │ ├── index.tsx # Landing page │ │ ├── chat.tsx # Chat interface │ │ └── api/ # Next.js API routes │ ├── components/ │ │ ├── ChatBox.tsx │ │ └── ModelSelector.tsx │ ├── public/ │ └── next.config.js │ ├── .env # Environment variables ├── docker-compose.yml # Docker configuration └── README.md




## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.9+ (for local development)

### Running with Docker

```bash
# Start the application
docker-compose up

# Visit http://localhost:3000 in your browser