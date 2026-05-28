#!/bin/sh
set -e

echo "Installing Node"

export HOMEBREW_NO_AUTO_UPDATE=1
brew install node@20

export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

node -v
npm -v

echo "Installing dependencies"

cd "$CI_PRIMARY_REPOSITORY_PATH"

npm install

echo "Installing pods"

cd ios
pod install --repo-update
