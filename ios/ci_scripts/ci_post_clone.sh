#!/bin/sh

set -e

echo "===== STARTING CI ====="

export HOMEBREW_NO_AUTO_UPDATE=1

if ! command -v node >/dev/null 2>&1; then
echo "Node not found. Installing Node 20..."
brew install node@20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
fi

echo "===== NODE VERSION ====="
node -v
npm -v

echo "===== GOING TO REPOSITORY ====="
cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "===== CLEANING ====="
rm -rf node_modules
rm -rf ios/Pods

echo "===== INSTALLING DEPENDENCIES ====="
npm install --legacy-peer-deps

echo "===== INSTALLING PODS ====="
cd ios
pod install --repo-update

echo "===== DONE ====="

