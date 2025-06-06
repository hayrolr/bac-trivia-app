#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Vercel Install Script: Started"
echo "Vercel Install Script: Installing system dependencies for node-canvas using YUM..."
# 1. Use YUM to install system dependencies for node-canvas on Amazon Linux 2
yum install -y cairo-devel libjpeg-turbo-devel pango-devel giflib-devel librsvg2-devel
echo "Vercel Install Script: System dependencies installed successfully."

# 2. Proceed with the standard npm installation
echo "Vercel Install Script: Running 'npm install'..."
npm install
echo "Vercel Install Script: Finished successfully."