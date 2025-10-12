# Agentic Abstract Wallet

> This project is implemented for the [Base Batches 002: Builder Track](https://base-batches-builder-track.devfolio.co/) builder program.

## Technology Used

- **Agentic RAG**
- **Abstract Wallet**: ERC-4337 with Base Smart Wallet
- **OpenRouter**: for OpenAI and Perplexity model
- **NestJS**: Backend framework
- **Next.js**: Frontend framework
- **npm Workspaces**: Monorepo management
- **Postgres and Pgvector**: Database and vector storage
- **Redis**: Caching and message queue
- **Viem & Permissionless**: Ethereum libraries for wallet operations

## Description

Agentic Wallet is a full-stack application that implements an Agentic RAG (Retrieval-Augmented Generation) system for blockchain and DeFi operations. The system employs a coordinated approach with multiple specialised agents to help users achieve their on-chain financial objectives. The project is structured as a monorepo with separate frontend and backend packages.

## Project Structure

This project is organized as a monorepo using npm Workspaces:

```
agentic-wallet/
├── package.json        # Root package.json for monorepo configuration
├── npm-workspace.yaml # npm workspace configuration
├── frontend/          # Next.js frontend application
├── backend/           # NestJS backend application
└── docs/              # Documentation files
```

## Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL with pgvector extension
- Redis

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/agentic-wallet.git
   cd agentic-wallet
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   # Edit backend/.env with your configuration
   ```

### Development

To run both frontend and backend concurrently:

```bash
npm dev
```

Or run them separately:

```bash
# Frontend only (Next.js)
npm dev:frontend

# Backend only (NestJS)
npm dev:backend
```

### Using the Dashboard

1. Start both the frontend and backend servers
2. Visit the landing page at `http://localhost:3001` (or the port shown in your terminal)
3. Click "Launch App" to access the dashboard
4. The dashboard provides a chat interface to interact with the AI agent
5. The chat connects to the backend API at `http://localhost:3000/agent/message`

**Note:** Make sure the backend is running on port 3000 for the chat to work properly.

### Building for Production

```bash
npm build         # Builds both frontend and backend
npm start         # Starts both services in production mode
```

## Agent Design

This section explains everything about how the agent works.

### Sub Agents

1. **Orchestrator**
   - Purpose: Coordinate sub-agents, manage workflow, retry/failover, logging, and batching
   - Inputs: User request, policy config
   - Outputs: Ordered tasks to sub-agents, overall state

2. **Planning Agent**
   - Role: Produce step-by-step plans to satisfy user requests
   - Inputs: User intent, constraints (budget, risk), profile snapshot
   - Outputs: Structured plan with tasks

3. **Research Agent**
   - Role: Perform deep retrieval and evidence collection (on-chain + off-chain)
   - Inputs: Queries from Planning Agent
   - Outputs: Structured facts, citations, raw documents, on-chain transaction examples

4. **Profiling Agent**
   - Role: Maintain user model and history; provide snapshots and compare plan to preferences
   - Stores: Holdings, risk tolerance, skills, past engagement, consent settings
   - Outputs: Profile snapshot, risk flags, historical actions

5. **Reviewer Agent**
   - Role: Merge Plan + Research + Profile outputs, refine language, normalize suggestions
   - Outputs: Ranked list of actionable suggestions with estimated cost, impact, and effort

6. **Wallet Agent (Executor)**
   - Role: Simulate, prepare transactions, estimate gas, create proposals for user approval
   - Modes: Suggest-only, Semi-autonomous, Delegated
   - Outputs: Prepared txs, simulation results, signed txs (only after consent)

7. **Judge / Validator Agent**
   - Role: Final quality gate, evaluate outputs against rules and policies
   - Checks: Policy compliance, safety, cost thresholds, slippage, exploit heuristics
   - Outputs: Pass/fail + reasons + suggested fixes

### Interaction Pattern

1. Orchestrator creates plan from Planning Agent
2. Orchestrator dispatches research tasks to Research Agent
3. Research and Profile return data; Orchestrator triggers Opportunity Scorer
4. Reviewer consolidates and creates user UI copy
5. Judge validates. If pass, Wallet Agent simulates and requests approval
6. After execution, Profile Agent updates memory; Report Agent records logs

### System Architecture Diagram

```
+-------------+      +--------------+      +--------------+
|  User Req   | ---> | Orchestrator | ---> | Planning AG  |
+-------------+      +--------------+      +--------------+
                            |                |  
                            v                v
                      +--------------+   +--------------+
                      | Research AG  |   | Profile AG   |
                      +--------------+   +--------------+
                            \                /
                             \              /
                              v            v
                          +----------------------+
                          | Opportunity Scorer   |
                          +----------------------+
                                    |
                                    v
                          +----------------------+
                          | Reviewer / Reporter  |
                          +----------------------+
                                    |
                                    v
                          +----------------------+
                          | Judge / Validator    |
                          +----------------------+
                                    |
                       pass / fail  v
                          +----------------------+
                          | Wallet Agent (sim)   |
                          +----------------------+
                                    |
                          user approval required
                                    |
                          +----------------------+
                          | Wallet Agent (exec)  |
                          +----------------------+
                                    |
                          +----------------------+
                          | Profile update / log |
                          +----------------------+
```

## Installation

```bash
$ npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# OpenRouter API settings
OPEN_ROUTER_API_KEY=your_openrouter_api_key
OPEN_ROUTER_THINK_MODEL_PROVIDER=openai
OPEN_ROUTER_THINK_MODEL_NAME=gpt-4o-mini
OPEN_ROUTER_RESEARCH_MODEL_PROVIDER=perplexity
OPEN_ROUTER_RESEARCH_MODEL_NAME=sonar-pro

# Wallet settings
PRIVATE_KEY=your_private_key
BASE_SCAN_USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_SCAN_EXPLORER=https://sepolia.basescan.org
```

See `.env.example` for a template.

## Wallet Integration

The system includes a comprehensive wallet integration using ERC-4337 account abstraction with Pimlico:

- **Wallet Service**: Core service for blockchain interactions
- **Wallet Agent Tool**: Tool for the agent to interact with the wallet
- **Plan Generator Tool**: Tool to extract wallet operations from plans

The wallet supports operations such as:
- Checking wallet balance
- Sending transactions
- Approving tokens
- Executing batch transactions

For more details, see the [Wallet Integration Documentation](./docs/wallet-integration.md) and [Wallet Usage Guide](./docs/wallet-usage-guide.md).

## Running the app

```bash
# development
$ npm start

# watch mode
$ npm start:dev

# production mode
$ npm start:prod
```

## Test

```bash
# unit tests
$ npm test

# e2e tests
$ npm test:e2e

# test coverage
$ npm test:cov
```

## API Usage

### Example Request

The Agentic RAG system exposes an endpoint at `/agent/message` that accepts POST requests with the following structure:

```bash
# Test the Agent Message Endpoint
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "collect ETH and earn some passive income I have 10 K USD",
    "preferences": {
      "risk_tolerance": "medium",
      "investment_amount": "$500",
      "time_horizon": "short-term"
    }
  }'
```

### Example Response

```json
{
  "message": "Plan approved! Here are the details:",
  "plan": {
    "goal": "Participate in the latest Arbitrum airdrop",
    "constraints": [
      "Medium risk tolerance",
      "Investment amount of $500",
      "Short-term time horizon"
    ],
    "steps": [
      {
        "step_number": 1,
        "title": "Research Airdrop Requirements",
        "type": "research",
        "description": "Look up the requirements and eligibility criteria for the latest Arbitrum airdrop.",
        "expected_outcome": "You will have a clear understanding of what is needed to qualify for the airdrop."
      },
      {
        "step_number": 2,
        "title": "Set Up a Compatible Wallet",
        "type": "execution",
        "description": "Create or ensure you have a cryptocurrency wallet that supports Arbitrum and airdrop participation.",
        "expected_outcome": "You will be ready to receive the airdrop in a compatible wallet."
      },
      {
        "step_number": 3,
        "title": "Acquire ETH for Gas Fees",
        "type": "execution",
        "description": "Purchase a small amount of ETH (for gas fees) to interact with the Arbitrum network. Ensure you keep your total expenses within the $500 investment limit.",
        "expected_outcome": "You will have enough ETH to cover transaction fees for participating in the airdrop."
      },
      {
        "step_number": 4,
        "title": "Participate in Necessary Activities",
        "type": "execution",
        "description": "Engage in any required activities (e.g., staking, using Uniswap, or similar) mentioned for the airdrop eligibility.",
        "expected_outcome": "You will have fulfilled the participation criteria necessary to qualify for the airdrop."
      },
      {
        "step_number": 5,
        "title": "Monitor Airdrop Announcement",
        "type": "analysis",
        "description": "Stay updated through social media and official Arbitrum channels regarding the airdrop announcement and distribution details.",
        "expected_outcome": "You will be informed about the airdrop timeline and distribution process."
      },
      {
        "step_number": 6,
        "title": "Claim Your Airdrop",
        "type": "execution",
        "description": "Follow the instructions provided to claim your airdrop during the specified claim period.",
        "expected_outcome": "You will successfully claim your airdrop rewards."
      }
    ],
    "estimated_timeline": "2-4 weeks for successful participation and airdrop claim",
    "success_metrics": [
      "Successfully completed all airdrop participation steps",
      "Received airdrop tokens in your wallet",
      "Maintained investment within $500"
    ]
  },
  "research": {
    "findings": [
      {
        "topic": "Arbitrum Airdrop Requirements and Eligibility (2025)",
        "summary": "The latest Arbitrum airdrop, known as the 'Season 1 Drip Airdrop,' runs for 20 weeks and distributes up to 80 million ARB tokens. It primarily targets active users on specific Arbitrum DeFi protocols (Morpha, Fluid, Uler, Dolomite, Silo). Participants must provide liquidity (depositing ETH or stablecoins), borrow USDC, and interact with supported protocols. More interaction and higher liquidity can increase rewards. All actions must be performed through a compatible wallet on arbitrumdrip.com or the official Arbitrum website. Rewards can be claimed every two weeks.",
        "relevance_score": 9.5,
        "sources": ["3"]
      },
      {
        "topic": "Technical Steps to Participate",
        "summary": "Participants must: (1) Set up a compatible crypto wallet (e.g., MetaMask) supporting the Arbitrum network. (2) Ensure the wallet is funded with ETH for gas fees, factoring this into the $500 budget. (3) Use the Arbitrum Drip or official Arbitrum site to deposit ETH or stablecoins and interact with relevant DeFi protocols. (4) Regularly monitor airdrop channels for updates and claim windows.",
        "relevance_score": 9,
        "sources": ["3"]
      },
      {
        "topic": "Eligibility Criteria and Points System",
        "summary": "Eligibility is based on a points system evaluating user actions such as bridging funds into Arbitrum, transaction frequency, value transacted, and providing liquidity on Arbitrum DeFi protocols. Engaging with a protocol frequently and bridging larger values increases points (and thus rewards). Each address can claim rewards proportional to their point score, but only activities before certain snapshot dates are counted for maximum points. Some criteria, like early adoption before 'Nitro' launch, are weighted heavier.",
        "relevance_score": 8.5,
        "sources": ["4","3"]
      },
      {
        "topic": "Budget and Risk Considerations",
        "summary": "A $500 investment is sufficient to actively participate in airdrop activities, provided a portion (typically a small percentage) is kept in ETH for transaction fees. Only interact with official, trusted channels and protocols to avoid phishing and loss of funds. The airdrop is designed for active ecosystem users, not passive holders. Rewards and requirements may change, so ongoing research is advised.",
        "relevance_score": 8,
        "sources": ["3"]
      },
      {
        "topic": "Airdrop Timelines and Claim Process",
        "summary": "The Season 1 Drip Airdrop ends on January 20, 2026 and is structured so rewards can be claimed every two weeks by eligible participants. To check eligibility and claim, connect your wallet to arbitrumdrip.com or the official Arbitrum site during the claim windows. Pool activity and participation must be tracked through the official dashboard.",
        "relevance_score": 8,
        "sources": ["3"]
      }
    ],
    "overall_assessment": "Participating in the latest Arbitrum airdrop (Season 1 Drip) requires active engagement with specific DeFi protocols on Arbitrum using a compatible wallet, reliably funded with ETH for gas fees. Eligibility is based on protocol usage and liquidity provision, favoring those who interact regularly and with more capital up to the investment limit. Rewards are distributed biweekly until the airdrop ends in January 2026. Always use verified official channels to avoid scams, and ensure your actions are maximizing your points under current airdrop rules."
  },
  "decision": {
    "decision": "approved",
    "reasoning": "The plan adheres well to the user's medium risk tolerance, budget constraints, and short-term time horizon. The outlined steps are comprehensive, engaging actively with the airdrop requirements while remaining within the $500 budget for investment and gas fees. The plan also considers critical research findings, ensuring compliance with protocol requirements and safe practices for participation.",
    "risk_assessment": {
      "financial_risk": "medium",
      "technical_risk": "medium",
      "compliance_risk": "low"
    },
    "improvement_suggestions": []
  },
  "status": "completed"
}
```
## Deployment Guide

See [deployment-guide.md](docs/deployment-guide.md) for detailed deployment instructions. 

## Implementation Considerations

- **RAG Details**: Uses vector DB + dense retrieval + LLM for synthesis, keeping provenance for each claim
- **Cost and Latency**: Uses model tiers - small models for planning/ranking, larger for final synthesis
- **Caching**: Caches research results and scored opportunities; only re-runs heavy research on stale signals
- **Testing**: Unit tests per agent, integration tests for flows, and golden examples for judge decisions
- **Observability**: Event logs, request/response traces, and explainer output
- **Privacy**: Allows users to opt-in/out for storing certain profile fields; encrypts stored memory
- **Governance**: Provides a "policy bundle" that Judge uses; allows users to tweak thresholds

## Safety, Consent and UX Rules

- Default mode is suggestion-only. Any on-chain write requires explicit user authorization
- Shows clear estimated cost, risk, and reason for each suggested action
- Maintains an immutable audit trail for actions the system prepared and executed
- Rate-limits and throttles potentially spammy behavior automatically
- Provides "undo" guidance where possible (e.g., how to unwind positions)

## License

This project is [MIT licensed](LICENSE).
