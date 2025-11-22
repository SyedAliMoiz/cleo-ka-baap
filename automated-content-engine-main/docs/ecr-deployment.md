# ECR-based Deployment for ACE Project

This document explains how to set up the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Automated Content Engine (ACE) project using AWS ECR and GitHub Actions.

## Overview

This deployment approach uses AWS Elastic Container Registry (ECR) to store Docker images and EC2 to run the application. The workflow:

1. Builds Docker images for each component (backend, frontend, nginx)
2. Pushes these images to private ECR repositories
3. Deploys the latest images to EC2 using Docker Compose

## Prerequisites

1. An AWS account with permissions to create and use ECR repositories
2. An EC2 instance with Docker and Docker Compose installed
3. IAM user with permissions to push to ECR and pull from ECR
4. Domain name configured with proper DNS records pointing to the EC2 instance
5. SSL certificates already set up using Certbot
6. MongoDB data volume configured on EC2

## Required AWS Setup

### 1. Create ECR Repositories

Create the following ECR repositories in your AWS account:

- `ace-backend`
- `ace-frontend`
- `ace-nginx`

You can create these repositories using the AWS Console or AWS CLI:

```bash
aws ecr create-repository --repository-name ace-backend
aws ecr create-repository --repository-name ace-frontend
aws ecr create-repository --repository-name ace-nginx
```

### 2. Create IAM User for GitHub Actions

1. Create an IAM user with permissions to push to and pull from ECR
2. Attach the `AmazonEC2ContainerRegistryPowerUser` policy to this user
3. Create access keys for this user

## Setting Up GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. `AWS_ACCESS_KEY_ID`: The access key ID for your IAM user
2. `AWS_SECRET_ACCESS_KEY`: The secret access key for your IAM user
3. `AWS_REGION`: The AWS region where your ECR repositories are located (e.g., `us-east-1`)
4. `SSH_PRIVATE_KEY`: The private SSH key to access your EC2 instance
5. `EC2_HOST`: The public IP address or hostname of your EC2 instance

To add these secrets:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the secrets with their respective values

## EC2 Instance Setup

Your EC2 instance needs to have:

1. Docker and Docker Compose installed
2. AWS CLI installed and configured to access ECR
3. A valid SSH key for GitHub Actions to connect

## AWS CLI Configuration on EC2

Configure AWS CLI on your EC2 instance to allow Docker to pull from ECR:

```bash
aws configure
```

Use the same IAM credentials with ECR permissions or create a role with appropriate permissions.

## Workflow Operation

The `.github/workflows/deploy-ecr.yml` workflow does the following:

1. Builds Docker images for each component
2. Tags images with the Git commit SHA and `latest`
3. Pushes these images to AWS ECR
4. Creates a deployment Docker Compose file
5. Copies this file to your EC2 instance
6. Executes a deployment script on EC2 that:
   - Pulls the latest images from ECR
   - Stops any running containers
   - Starts the application with the new images

## Triggering Deployments

Deployments are triggered automatically when:
- Code is pushed to the `main` branch

You can also trigger a deployment manually:
1. Go to the "Actions" tab in your GitHub repository
2. Select the "Build and Deploy to ECR/EC2" workflow
3. Click "Run workflow"
4. Select the branch to deploy from
5. Click "Run workflow"

## Troubleshooting

### Authentication Issues

If you're having issues with AWS authentication:
- Check that your IAM credentials have the correct permissions
- Verify that your GitHub secrets are properly set up
- Ensure the EC2 instance has the right permissions to pull from ECR

### Image Building Issues

If image building fails:
- Review the Dockerfiles to ensure they're correctly configured
- Check that all required build dependencies are available

### Deployment Issues

If deployment to EC2 fails:
- Verify SSH connectivity to the EC2 instance
- Check that Docker and Docker Compose are properly installed
- Ensure the EC2 instance has enough disk space and resources
- Review the Docker Compose configuration for any errors

## Monitoring Deployments

You can monitor the status of deployments by:
1. Viewing the workflow run in the GitHub Actions tab
2. SSH'ing into your EC2 instance and running:
   ```bash
   docker-compose -f docker-compose.deploy.yml ps
   ```
3. Checking container logs:
   ```bash
   docker-compose -f docker-compose.deploy.yml logs
   ``` 