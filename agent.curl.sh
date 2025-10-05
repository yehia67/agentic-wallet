#!/bin/bash

# Test the Agent Message Endpoint
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
