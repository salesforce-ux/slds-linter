#!/bin/bash

# Check Node.js version
required_version="^20.19.0 || ^22.13.0 || >=24"
current_version=$(node -v | cut -c 2-)
IFS=. read -r current_major current_minor _ <<EOF
$current_version
EOF

if ! { [ "$current_major" -eq 20 ] && [ "$current_minor" -ge 19 ]; } &&
   ! { [ "$current_major" -eq 22 ] && [ "$current_minor" -ge 13 ]; } &&
   ! [ "$current_major" -ge 24 ]; then
    echo "Error: Node.js version $required_version is required."
    echo "Current version: $current_version"
    exit 1
fi

echo "Node.js version check passed."

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "Error: yarn is not installed. Please install yarn and try again."
    exit 1
fi

# Check if npm is being used
if [ "$npm_config_user_agent" != "${npm_config_user_agent#npm}" ]; then
    echo "Error: Please use yarn instead of npm for this project."
    exit 1
fi

echo "Yarn check passed. Continuing with installation..."
