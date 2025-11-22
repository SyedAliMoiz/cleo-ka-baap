#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting VyraLab Automated Content Engine ===${NC}"

# Check if Docker is running
echo -e "${YELLOW}Checking if Docker is running...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${YELLOW}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Directory setup
PROJECT_ROOT=$(pwd)
echo -e "${YELLOW}Project root: $PROJECT_ROOT${NC}"

# Check if MongoDB container exists
echo -e "${YELLOW}Checking MongoDB container status...${NC}"
MONGO_CONTAINER=$(docker ps -a --filter "name=^/mongodb$" --format "{{.Status}}")

if [[ "$MONGO_CONTAINER" == "" ]]; then
  echo -e "${YELLOW}No MongoDB container found. Creating a new one...${NC}"
  docker run --name mongodb -d -p 27017:27017 -v ace-mongodb-data:/data/db mongo:latest
  echo -e "${GREEN}MongoDB container created and started.${NC}"
elif [[ "$MONGO_CONTAINER" == *"Up"* ]]; then
  echo -e "${GREEN}MongoDB container is already running.${NC}"
else
  echo -e "${YELLOW}MongoDB container exists but is not running. Restarting it...${NC}"
  docker start mongodb
  echo -e "${GREEN}MongoDB container started.${NC}"
fi

# Wait for MongoDB to initialize
echo -e "${YELLOW}Waiting for MongoDB to initialize...${NC}"
sleep 5

# Start the backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd $PROJECT_ROOT/backend
echo -e "${YELLOW}Installing backend dependencies...${NC}"
npm install --silent
echo -e "${YELLOW}Installing validation dependencies...${NC}"
npm install class-validator class-transformer --silent
echo -e "${YELLOW}Starting NestJS server...${NC}"
npm run start:dev &
BACKEND_PID=$!
echo -e "${GREEN}Backend server started (PID: $BACKEND_PID)${NC}"

# Wait for backend to initialize
echo -e "${YELLOW}Waiting for backend to initialize...${NC}"
sleep 5

# Start the frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd $PROJECT_ROOT/frontend
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install --silent
echo -e "${YELLOW}Starting Next.js dev server...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend server started (PID: $FRONTEND_PID)${NC}"

# Print access URLs
echo -e "\n${GREEN}=== Services Started ===${NC}"
echo -e "${GREEN}MongoDB:${NC} mongodb://localhost:27017"
echo -e "${GREEN}Backend API:${NC} http://localhost:4000"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Trap function to clean up when the script is interrupted
trap 'echo -e "\n${YELLOW}Shutting down services...${NC}"; kill $BACKEND_PID $FRONTEND_PID; echo -e "${GREEN}Services stopped${NC}"; exit 0' INT

# Keep script running until Ctrl+C is pressed
wait 