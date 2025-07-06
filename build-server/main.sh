#!/bin/bash

# Validate that the URL is actually set
if [ -z "$GIT_REPOSITORY__URL" ]; then
  echo " GIT_REPOSITORY__URL is not set"
  exit 1
fi

echo "✅ Cloning from: $GIT_REPOSITORY__URL"
git clone "$GIT_REPOSITORY__URL" /home/app/output || {
  echo " Failed to clone repository"
  exit 1
}

exec node script.js


