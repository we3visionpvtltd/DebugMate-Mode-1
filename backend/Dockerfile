# Step 1: Base image
FROM python:3.11-slim

# Step 2: Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Step 3: Set working directory
WORKDIR /app

# Step 4: Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy the rest of the project
COPY . .

# Step 6: Expose port (Hugging Face Spaces default: 7860)
EXPOSE 7860

# Step 7: Start the Flask app with Gunicorn
# If your file is app.py and Flask instance is named "app"
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "app:app", "--workers", "2", "--threads", "2"]
