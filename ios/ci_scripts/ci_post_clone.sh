#!/bin/sh

set -e
set -x

echo "===== STARTING CI ====="

# Prevent Homebrew from wasting time
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

echo "===== INSTALLING BUILD TOOLS ====="

# Install Node 20 (safe if already installed)
brew install node@20 || true
brew link --overwrite node@20 || true

# Required by React Native 0.81 / Hermes source builds
brew install cmake || true

echo "===== TOOL VERSIONS ====="
node -v
npm -v
cmake --version

echo "===== GOING TO REPOSITORY ====="
cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "===== CLEANING ====="
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build

echo "===== INSTALLING DEPENDENCIES ====="
npm ci --legacy-peer-deps

echo "===== INSTALLING PODS ====="
cd ios
pod install --repo-update

echo "===== CI SETUP COMPLETE ====="