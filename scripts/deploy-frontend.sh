#!/bin/bash

# Deploy Frontend to Heroku
# This script uses git subtree to deploy only the frontend directory

set -e  # Exit on error

echo "🚀 Deploying Frontend to Heroku..."
echo ""

# Check if heroku-frontend remote exists
if ! git remote | grep -q "^heroku-frontend$"; then
    echo "⚠️  Heroku frontend remote not found. Adding it now..."
    git remote add heroku-frontend https://git.heroku.com/agentic-wallet.git
    echo "✅ Heroku frontend remote added"
    echo ""
fi

# Split the frontend directory and push to Heroku
echo "📦 Creating frontend subtree..."
FRONTEND_COMMIT=$(git subtree split --prefix frontend main)
echo "✅ Frontend subtree created: $FRONTEND_COMMIT"
echo ""

echo "⬆️  Pushing to Heroku..."
git push heroku-frontend $FRONTEND_COMMIT:main --force
echo ""

echo "✅ Frontend deployed successfully!"
echo "🌐 URL: https://agentic-wallet-cb890a7a49a1.herokuapp.com/"
echo ""
echo "📋 View logs with: heroku logs --tail -a agentic-wallet"
