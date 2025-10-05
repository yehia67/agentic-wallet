#!/bin/bash

# Set text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Agentic RAG API ===${NC}"

# Example 1: Arbitrum Airdrop
echo -e "\n${GREEN}Example 1: Arbitrum Airdrop${NC}"
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to participate in the latest Arbitrum airdrop. What steps should I take?",
    "preferences": {
      "risk_tolerance": "medium",
      "investment_amount": "$500",
      "time_horizon": "short-term"
    }
  }'

# Example 2: DeFi Yield Farming
echo -e "\n\n${GREEN}Example 2: DeFi Yield Farming${NC}"
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to maximize my yield farming returns with $1000. What are the best strategies?",
    "preferences": {
      "risk_tolerance": "high",
      "investment_amount": "$1000",
      "time_horizon": "medium-term",
      "preferred_chains": ["Ethereum", "Solana", "Polygon"]
    }
  }'

# Example 3: NFT Investment
echo -e "\n\n${GREEN}Example 3: NFT Investment${NC}"
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am interested in investing in NFTs. How should I start?",
    "preferences": {
      "risk_tolerance": "low",
      "investment_amount": "$2000",
      "time_horizon": "long-term",
      "interests": ["art", "gaming", "collectibles"]
    }
  }'

echo -e "\n"

