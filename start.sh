#!/bin/bash

# Start Backend
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Start Frontend
echo "Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Register the cleanup function for when script receives SIGINT (Ctrl+C)
trap cleanup SIGINT

echo "Both servers are running. Press Ctrl+C to stop."

# Wait for user to press Ctrl+C
wait 