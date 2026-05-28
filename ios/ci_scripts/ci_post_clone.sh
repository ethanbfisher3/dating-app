#!/bin/sh

# 'set -e' stops the script if any command fails
# 'set -x' prints every command to the Xcode Cloud logs so you can see what failed
set -e
set -x

echo "===== STARTING CI ====="

# Speed up Homebrew
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

# Check for Node and install if missing
if ! command -v node >/dev/null 2>&1; then
    echo "Node not found. Installing Node 20..."
    brew install node@20
    
    # Link it so the system can find it without hardcoding paths
    brew link --overwrite node@20
fi

echo "===== NODE VERSION ====="
node -v
npm -v

echo "===== GOING TO REPOSITORY ====="
cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "===== CLEANING ====="
# Using '|| true' ensures the script doesn't fail if these folders don't exist yet
rm -rf node_modules || true
rm -rf ios/Pods || true

echo "===== INSTALLING DEPENDENCIES ====="
npm install --legacy-peer-deps

echo "===== INSTALLING PODS ====="
cd ios
pod install --repo-update

echo "===== DONE ====="
