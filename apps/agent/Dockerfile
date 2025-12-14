FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY agent.py .
RUN apt-get update && apt-get install -y --no-install-recommends iputils-ping ca-certificates && rm -rf /var/lib/apt/lists/*
ENV PYTHONUNBUFFERED=1
CMD ["python", "agent.py"]
