#!/bin/bash

# Variables
BACKUP_DIR="/home/ec2-user/backups/ssl"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/letsencrypt_backup_$DATE.tar.gz"
DOMAIN="ace.vyralab.com"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup of Let's Encrypt certificates
sudo tar -czf "$BACKUP_FILE" /etc/letsencrypt

# Keep only last 5 backups
find "$BACKUP_DIR" -name "letsencrypt_backup_*.tar.gz" -type f -mtime +30 -delete

# Optional: Upload to S3
# aws s3 cp "$BACKUP_FILE" "s3://your-bucket/ssl-backups/"

echo "SSL certificate backup completed: $BACKUP_FILE"

# Verify certificate expiration
CERT_EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f 2)
CURRENT_DATE=$(date)

echo "Current date: $CURRENT_DATE"
echo "Certificate expiry: $CERT_EXPIRY"
echo "Domain: $DOMAIN" 