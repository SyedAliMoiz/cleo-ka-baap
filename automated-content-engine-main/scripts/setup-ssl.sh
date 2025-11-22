#!/bin/bash

# Set domain name
DOMAIN="ace.vyralab.com"
EMAIL="your-email@example.com"  # Replace with your email

# Create the certbot container
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v ~/ace/certbot-webroot:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --preferred-challenges http \
  -d $DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email

# Verify certificate was issued
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "SSL certificate issued successfully for $DOMAIN!"
  echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
  echo "Certificate will auto-renew via the certbot container in docker-compose"
else
  echo "Failed to issue SSL certificate for $DOMAIN"
  exit 1
fi

# Set up cron job for certificate verification (belt and suspenders approach)
(crontab -l 2>/dev/null; echo "0 3 * * * docker-compose -f ~/ace/docker-compose.yml restart certbot") | crontab -

echo "SSL setup complete! You can now restart your service with:"
echo "cd ~/ace && docker-compose down && docker-compose up -d" 