FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir \
    fastapi==0.111.0 \
    "uvicorn[standard]==0.30.1" \
    pydantic==2.7.1
COPY app ./app
ENV NOTIFICATIONS_DB_PATH=/data/notifications.db
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
