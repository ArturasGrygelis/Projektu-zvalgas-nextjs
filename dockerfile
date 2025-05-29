FROM python:3.11-slim

WORKDIR /app

# Install backend dependencies
COPY ./backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code
COPY ./backend ./backend

# Copy docs to the paths the backend expects
COPY ./docs ./backend/docs
COPY ./docs2 ./backend/docs2

# Copy env file (if exists)
COPY ./.env /app/backend/.env

# Install Node.js for frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy frontend code
COPY ./frontend ./frontend

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install && npm run build

# Go back to root
WORKDIR /app

# Make sure docs directories exist with proper permissions
RUN mkdir -p /app/backend/docs/chroma /app/backend/docs2/chroma && \
    chmod -R 777 /app/backend/docs /app/backend/docs2

# Only expose the frontend port since all traffic goes through it
EXPOSE 3000

# Create a startup script
RUN echo '#!/bin/bash \n\
cd /app/backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 & \n\
cd /app/frontend && npm run -- start -H 0.0.0.0 \n\
' > /app/start.sh && chmod +x /app/start.sh

# Run both services
CMD ["/app/start.sh"]