#!/bin/bash
set -e

# Login to ECR
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Stop any running containers
docker-compose -f docker-compose.deploy.yml down || echo "No containers to stop"

# Pull latest images
docker-compose -f docker-compose.deploy.yml pull

# Start containers
docker-compose -f docker-compose.deploy.yml up -d

# Print status
docker-compose -f docker-compose.deploy.yml ps

echo "Deployment completed successfully"