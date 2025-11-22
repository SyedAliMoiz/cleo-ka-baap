#!/bin/bash

# Variables
EBS_DEVICE="/dev/xvdf"
MOUNT_POINT="/data/db"
FSTYPE="ext4"

# Check if EBS volume is already attached
if [ ! -b "$EBS_DEVICE" ]; then
    echo "EBS volume not found at $EBS_DEVICE"
    exit 1
fi

# Check if the volume is already mounted
if mountpoint -q "$MOUNT_POINT"; then
    echo "Volume is already mounted at $MOUNT_POINT"
    exit 0
fi

# Create mount point if it doesn't exist
sudo mkdir -p "$MOUNT_POINT"

# Check if the volume is already formatted
if ! sudo blkid "$EBS_DEVICE"; then
    echo "Formatting EBS volume..."
    sudo mkfs -t "$FSTYPE" "$EBS_DEVICE"
fi

# Add mount to fstab for persistence
if ! grep -q "$EBS_DEVICE" /etc/fstab; then
    echo "Adding mount to fstab..."
    echo "$EBS_DEVICE $MOUNT_POINT $FSTYPE defaults,nofail 0 2" | sudo tee -a /etc/fstab
fi

# Mount the volume
echo "Mounting EBS volume..."
sudo mount "$EBS_DEVICE" "$MOUNT_POINT"

# Set proper permissions for MongoDB
sudo chown -R 999:999 "$MOUNT_POINT"
sudo chmod 755 "$MOUNT_POINT"

echo "EBS volume setup complete!" 