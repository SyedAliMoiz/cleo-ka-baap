#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Checking VyraLab Services Health ===${NC}"

# Check MongoDB
echo -e "\n${YELLOW}Checking MongoDB...${NC}"
if docker ps | grep -q "mongodb"; then
  echo -e "${GREEN}✓ MongoDB container is running${NC}"
else
  echo -e "${RED}✗ MongoDB container is not running${NC}"
  echo -e "  Try running: docker run --name mongodb -d -p 27017:27017 -v ace-mongodb-data:/data/db mongo:latest"
fi

# Check Backend API
echo -e "\n${YELLOW}Checking Backend API...${NC}"
if curl -s http://localhost:4000 > /dev/null; then
  echo -e "${GREEN}✓ Backend API is running${NC}"
  
  # Check specific API endpoints
  echo -e "\n${YELLOW}Testing Backend API endpoints...${NC}"
  
  # Test clients endpoint
  if curl -s http://localhost:4000/clients > /dev/null; then
    echo -e "${GREEN}✓ Clients endpoint is accessible${NC}"
  else
    echo -e "${RED}✗ Clients endpoint is not accessible${NC}"
  fi
else
  echo -e "${RED}✗ Backend API is not running${NC}"
  echo -e "  Check if NestJS server is running with: cd backend && npm run start:dev"
fi

# Check Frontend
echo -e "\n${YELLOW}Checking Frontend...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
  echo -e "${GREEN}✓ Frontend is running${NC}"
else
  echo -e "${RED}✗ Frontend is not running${NC}"
  echo -e "  Check if Next.js server is running with: cd frontend && npm run dev"
fi

echo -e "\n${YELLOW}=== Health Check Complete ===${NC}"
echo -e "MongoDB URL: mongodb://localhost:27017"
echo -e "Backend API: http://localhost:4000"
echo -e "Frontend URL: http://localhost:3000" 