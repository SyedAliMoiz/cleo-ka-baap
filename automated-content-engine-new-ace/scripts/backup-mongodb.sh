#!/bin/bash

# Variables
BACKUP_DIR="/home/ubuntu/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
docker-compose exec -T mongo mongodump --archive --gzip > "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "backup_*.gz" -mtime +7 -delete

# Optional: Upload to S3
# aws s3 cp "$BACKUP_FILE" "s3://your-bucket/mongodb-backups/"

echo "Backup completed: $BACKUP_FILE" 