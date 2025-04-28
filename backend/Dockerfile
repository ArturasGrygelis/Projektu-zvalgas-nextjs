FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Create a non-root user for better security
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --default-timeout=180 -r requirements.txt

# Copy application code
COPY . /app/

# Set ownership to non-root user
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose the port
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]