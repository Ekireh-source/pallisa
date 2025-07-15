#!/bin/bash

# Start Django backend
(
  echo "[BACKEND] Activating virtualenv and starting Django server..."
  cd pallisa_api
  source venv/bin/activate
  python manage.py makemigrations
  python manage.py migrate
  python manage.py runserver 0.0.0.0:8000
) &

# Start Next.js frontend
(
  echo "[FRONTEND] Starting Next.js dev server..."
  cd client
  pnpm dev
) &

# Wait for both to exit
wait 