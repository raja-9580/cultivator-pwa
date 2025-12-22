#!/bin/bash

# Only deploy on main branch
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "✅ Deploying: This is the main branch"
  exit 1
else
  echo "🛑 Skipping deployment: Not on main branch"
  exit 0
fi
