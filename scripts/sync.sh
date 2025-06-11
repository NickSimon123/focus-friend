#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

# Get the current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
check_status "Getting current branch"

# Add all changes
echo "Adding changes..."
git add .
check_status "Adding changes"

# Commit changes with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
echo "Committing changes..."
git commit -m "Auto-sync: $TIMESTAMP"
check_status "Committing changes"

# Push changes
echo "Pushing changes to $BRANCH..."
git push origin $BRANCH
check_status "Pushing changes"

echo -e "${GREEN}✓ Sync completed successfully${NC}" 