#!/bin/sh

set -e

# Install Node.js
brew install node

# Install npm dependencies (required for pod install to resolve Expo modules)
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

# Run pod install
cd ios
pod install
