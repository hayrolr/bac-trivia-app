#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Vercel Install Script: Started"

# 1. Update package list and install system dependencies for node-canvas
# The '-y' flag automatically answers 'yes' to any installation prompts.
echo "Vercel Install Script: Installing system dependencies for node-canvas..."
apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
echo "Vercel Install Script: System dependencies installed successfully."

# 2. Proceed with the standard npm installation
echo "Vercel Install Script: Running 'npm install'..."
npm install
echo "Vercel Install Script: Finished successfully."