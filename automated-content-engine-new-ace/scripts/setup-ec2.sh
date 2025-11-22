#!/bin/bash

# Update system packages
sudo yum update -y

# Install Docker
sudo yum install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo yum update -y
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p ~/ace
mkdir -p ~/ace/certbot-webroot

# Set up EBS volume
chmod +x ~/ace/scripts/setup-ebs.sh
~/ace/scripts/setup-ebs.sh

# Create a systemd service for the application
sudo tee /etc/systemd/system/ace.service << EOF
[Unit]
Description=ACE Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/ace
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ec2-user

[Install]
WantedBy=multi-user.target
EOF

# Create environment files
cat > ~/ace/frontend/.env << EOL
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://ace.vyralab.com/api
EOL

cat > ~/ace/backend/.env << EOL
NODE_ENV=production
MONGODB_URI=mongodb://mongo:27017/ace
EOL

# Setup SSL certificates
chmod +x ~/ace/scripts/setup-ssl.sh
~/ace/scripts/setup-ssl.sh

# Enable and start the service
sudo systemctl enable ace.service
sudo systemctl start ace.service

# Setup monitoring
mkdir -p ~/backups/mongodb

cat > ~/ace/monitor.sh << EOL
#!/bin/bash
# Check disk space
DISK_USAGE=\$(df -h | grep /data/db | awk '{print \$5}' | sed 's/%//g')
if [ "\$DISK_USAGE" -gt 80 ]; then
  echo "Warning: MongoDB disk usage is high (\$DISK_USAGE%)"
fi

# Check if containers are running
if ! docker ps | grep -q ace_mongo; then
  echo "Warning: MongoDB container is not running"
fi

# Check SSL certificate expiration
CERT_EXPIRY=\$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/ace.vyralab.com/fullchain.pem | cut -d= -f 2)
CERT_EXPIRY_DATE=\$(date -d "\$CERT_EXPIRY" +%s)
CURRENT_DATE=\$(date +%s)
DAYS_REMAINING=\$(( (\$CERT_EXPIRY_DATE - \$CURRENT_DATE) / 86400 ))

if [ "\$DAYS_REMAINING" -lt 14 ]; then
  echo "Warning: SSL certificate will expire in \$DAYS_REMAINING days"
fi
EOL

chmod +x ~/ace/monitor.sh

# Add monitoring to cron
(crontab -l 2>/dev/null; echo "0 * * * * ~/ace/monitor.sh") | crontab - 