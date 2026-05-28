#!/bin/sh
set -e

echo "===== STARTING CI POST CLONE ====="

# Move to repository root

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "===== NODE INFO ====="
node -v
npm -v

echo "===== CLEANING OLD FILES ====="

rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build

echo "===== INSTALLING JS DEPENDENCIES ====="

npm install --legacy-peer-deps

echo "===== INSTALLING COCOAPODS ====="

cd ios

pod install --repo-update

echo "===== CI POST CLONE FINISHED ====="

