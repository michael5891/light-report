#!/bin/sh

set -e

echo "Reset Git"
git reset --hard "origin/master"

echo "Running Git pull"
git checkout "master"
git pull origin "master"

if [ "$FULL_BUILD" == "true" ]
    then
        echo "Clearing Workspace"
        rm -Rf ./client/bower_components
        rm -Rf ./node_modules
fi

echo "Change to the correct node version"
source ~/.nvm/nvm.sh
nvm use 4.0.0

echo "Running NPM install only dev"
npm install --only=dev

echo "Running Bower install"
bower install

echo "Running unit tests"
grunt test

# it is important to bump version before building bower package because our grunt uses the package.json's version
echo "Bumping NPM version"
NPM_VERSION=$(npm version --no-git-tag-version patch)

echo "Building bower package"
grunt build

echo "Git commiting (no push yet)"
git add -A
git commit -m "Upgrade to $NPM_VERSION as part of release $RELEASE_VER build"

echo "Git adding tag"
git tag -a "$NPM_VERSION" -m "Production Release $NPM_VERSION"

echo "Pushing commits to git"
git push origin

echo "Pushing tags to git"
git push origin --tags

echo "Publishing to NPM Repository"
npm publish