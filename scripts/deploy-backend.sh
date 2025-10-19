#!/bin/bash

# Deploy Backend to Heroku
# This script uses git subtree to deploy only the backend directory

set -e  # Exit on error

echo "🚀 Deploying Backend to Heroku..."
echo ""

# Check if heroku remote exists
if ! git remote | grep -q "^heroku$"; then
    echo "⚠️  Heroku remote not found. Adding it now..."
    heroku git:remote -a agentic-wallet-api
    echo "✅ Heroku remote added"
    echo ""
fi

# Split the backend directory and push to Heroku
echo "📦 Creating backend subtree..."
BACKEND_COMMIT=$(git subtree split --prefix backend main)
echo "✅ Backend subtree created: $BACKEND_COMMIT"
echo ""

echo "⬆️  Pushing to Heroku..."
git push heroku $BACKEND_COMMIT:main --force
echo ""

echo "✅ Backend deployed successfully!"
echo "🌐 URL: https://agentic-wallet-api-68c26b243be1.herokuapp.com/"
echo ""
echo "📋 View logs with: heroku logs --tail -a agentic-wallet-api"
