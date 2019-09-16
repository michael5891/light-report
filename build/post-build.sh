#!/bin/sh

echo "Pushing commits to git"
git push origin

echo "Pushing tags to git"
git push origin --tags

echo "Publishing to NPM Repository"
npm publish