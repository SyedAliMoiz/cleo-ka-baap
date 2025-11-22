#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Verifying deployment...${NC}"

# Check if all containers are running
CONTAINERS=$(docker-compose ps -q)
CONTAINER_COUNT=$(echo "$CONTAINERS" | wc -l)

if [ "$CONTAINER_COUNT" -lt 4 ]; then
  echo -e "${RED}Error: Not all containers are running. Expected 4, found $CONTAINER_COUNT${NC}"
  docker-compose ps
  exit 1
fi

echo -e "${GREEN}✓ All containers are running${NC}"

# Check if nginx is accepting connections
echo -e "${YELLOW}Checking nginx...${NC}"
if curl -s --head --fail http://localhost:80 > /dev/null; then
  echo -e "${GREEN}✓ Nginx is accepting connections${NC}"
else
  echo -e "${RED}Error: Nginx is not accepting connections${NC}"
  docker-compose logs nginx
  exit 1
fi

# Check if frontend is accessible
echo -e "${YELLOW}Checking frontend...${NC}"
if curl -s http://localhost:3000 | grep -q "<html"; then
  echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
  echo -e "${RED}Error: Frontend is not accessible${NC}"
  docker-compose logs frontend
  exit 1
fi

# Check if backend API is accessible
echo -e "${YELLOW}Checking backend API...${NC}"
if curl -s http://localhost:4000 | grep -q "API"; then
  echo -e "${GREEN}✓ Backend API is accessible${NC}"
else
  echo -e "${RED}Error: Backend API is not accessible${NC}"
  docker-compose logs backend
  exit 1
fi

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB...${NC}"
if docker-compose exec mongo mongo --eval "db.stats()" | grep -q "collections"; then
  echo -e "${GREEN}✓ MongoDB is running${NC}"
else
  echo -e "${RED}Error: MongoDB is not running correctly${NC}"
  docker-compose logs mongo
  exit 1
fi

# Check disk space
echo -e "${YELLOW}Checking disk space...${NC}"
DISK_USAGE=$(df -h | grep /data/db | awk '{print $5}' | sed 's/%//g')
if [ -n "$DISK_USAGE" ] && [ "$DISK_USAGE" -lt 90 ]; then
  echo -e "${GREEN}✓ Disk space is sufficient (${DISK_USAGE}% used)${NC}"
else
  echo -e "${YELLOW}Warning: Disk space may be low or not mounted correctly${NC}"
  df -h
fi

# Check SSL certificate
echo -e "${YELLOW}Checking SSL certificate...${NC}"
if [ -f "/etc/letsencrypt/live/ace.vyralab.com/fullchain.pem" ]; then
  CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/ace.vyralab.com/fullchain.pem | cut -d= -f 2)
  CERT_EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
  CURRENT_DATE=$(date +%s)
  DAYS_REMAINING=$(( ($CERT_EXPIRY_DATE - $CURRENT_DATE) / 86400 ))
  
  if [ "$DAYS_REMAINING" -gt 14 ]; then
    echo -e "${GREEN}✓ SSL certificate is valid for $DAYS_REMAINING more days${NC}"
  else
    echo -e "${YELLOW}Warning: SSL certificate will expire in $DAYS_REMAINING days${NC}"
  fi
else
  echo -e "${YELLOW}Warning: SSL certificate not found or not accessible${NC}"
fi

echo -e "\n${GREEN}Deployment verification completed successfully!${NC}"
exit 0 