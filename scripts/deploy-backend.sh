#!/bin/bash

# Deploy Backend to Heroku
# This script uses git subtree to deploy only the backend directory

set -e  # Exit on error

echo "🚀 Deploying Backend to Heroku..."
echo ""

# Check if heroku-backend remote exists
if ! git remote | grep -q "^heroku-backend$"; then
    echo "⚠️  Heroku backend remote not found. Adding it now..."
    git remote add heroku-backend https://git.heroku.com/agentic-wallet-api.git
    echo "✅ Heroku backend remote added"
    echo ""
fi

# Split the backend directory and push to Heroku
echo "📦 Creating backend subtree..."
BACKEND_COMMIT=$(git subtree split --prefix backend main)
echo "✅ Backend subtree created: $BACKEND_COMMIT"
echo ""

echo "⬆️  Pushing to Heroku..."
git push heroku-backend $BACKEND_COMMIT:main --force
echo ""

echo "✅ Backend deployed successfully!"
echo "🌐 URL: https://agentic-wallet-api-68c26b243be1.herokuapp.com/"
echo ""
echo "📋 View logs with: heroku logs --tail -a agentic-wallet-api"
