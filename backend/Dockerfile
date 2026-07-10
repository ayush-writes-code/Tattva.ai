FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for OpenCV, Matplotlib, and other libraries
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create needed directories
RUN mkdir -p temp outputs/reports hf_cache

# Create a non-root user and switch to it for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Set Hugging Face cache directory
ENV HF_HOME=/app/hf_cache

# Expose port (Hugging Face Spaces default is 7860)
EXPOSE 7860

# Run FastAPI app with 4 workers for better concurrency
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "4"]
