# CI/CD Pipeline Setup for ACE Project

This document explains how to set up the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Automated Content Engine (ACE) project using GitHub Actions to deploy to an EC2 instance.

## Prerequisites

1. An EC2 instance with Docker and Docker Compose installed
2. Domain name configured with proper DNS records pointing to the EC2 instance
3. SSL certificates already set up using Certbot
4. MongoDB data volume configured

## Setting Up GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. `SSH_PRIVATE_KEY`: The private SSH key to access your EC2 instance
2. `EC2_HOST`: The public IP address or hostname of your EC2 instance

To add these secrets:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the secrets with their respective values

## Generating SSH Keys for Deployment

If you don't have an SSH key pair yet:

1. Run the following command to generate a new SSH key pair:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/ace_deploy
   ```

2. Copy the public key to your EC2 instance:
   ```bash
   ssh-copy-id -i ~/.ssh/ace_deploy.pub ec2-user@<your-ec2-ip>
   ```

3. Add the private key content to the `SSH_PRIVATE_KEY` secret in GitHub:
   ```bash
   cat ~/.ssh/ace_deploy
   ```
## GitHub Actions Workflow

The CI/CD pipeline is configured in `.github/workflows/deploy.yml` and performs the following steps:

1. Checks out the code from the repository
2. Sets up SSH access to the EC2 instance
3. Compresses the project files
4. Transfers files to the EC2 instance
5. Extracts and deploys the application
6. Preserves environment configuration
7. Rebuilds and starts Docker containers
8. Verifies the deployment is healthy
9. Rolls back automatically if verification fails

## Deployment Verification

The deployment verification process checks:

1. All Docker containers are running
2. Nginx is accepting connections
3. Frontend application is accessible
4. Backend API is responsive
5. MongoDB is operational
6. Disk space is sufficient
7. SSL certificate is valid and not expiring soon

If any of these checks fail, the deployment is automatically rolled back to the previous working version.

## Checking Deployment Status

You can check the status of your deployment by:

1. Viewing the workflow run in the GitHub Actions tab
2. Checking Slack notifications (if configured)
3. SSHing into your EC2 instance and checking Docker containers:
   ```bash
   ssh ec2-user@<your-ec2-ip>
   cd ~/ace
   docker-compose ps
   ```
4. Running the verification script manually:
   ```bash
   cd ~/ace
   ./scripts/verify-deployment.sh
   ```

## Troubleshooting

If your deployment fails, check:

1. GitHub Actions logs for error messages
2. SSH connection issues (make sure your SSH key is correctly set up)
3. EC2 instance access (security groups, network ACLs)
4. Docker logs on the EC2 instance:
   ```bash
   cd ~/ace
   docker-compose logs
   ```
5. Verification script output to identify specific service failures

## Rolling Back Deployments

The CI/CD pipeline automatically rolls back failed deployments. If you need to manually roll back:

1. SSH into your EC2 instance
2. Navigate to your application directory:
   ```bash
   cd ~/ace
   ```
3. Stop the current deployment:
   ```bash
   docker-compose down
   ```
4. Use Git to checkout a previous commit:
   ```bash
   git checkout <previous-commit-hash>
   ```
5. Rebuild and start the containers:
   ```bash
   docker-compose up --build -d
   ```
``` 