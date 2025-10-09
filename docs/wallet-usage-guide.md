# Wallet Usage Guide

This guide explains how to use the wallet functionality in the agentic system.

## Setting Up Environment Variables

Before using the wallet functionality, you need to set up the following environment variables:

```
PRIVATE_KEY=<your-pk>
PIMLICO_API_KEY=<your_api_key>
PIMLICO_RPC=<rpc-url>
BASE_SCAN_USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_SCAN_EXPLORER=https://sepolia.basescan.org
```

You can copy the `.env.example` file to `.env` and fill in the values:

```bash
cp .env.example .env
```

## Using the Agent API

The agent API allows you to interact with the wallet through natural language:

```http
POST /agent/message
Content-Type: application/json

{
  "message": "Check my wallet balance",
  "preferences": {
    "riskTolerance": "low"
  }
}
```

Example response:

```json
{
  "message": "Plan approved! Here are the details:",
  "plan": {
    "goal": "Check wallet balance",
    "constraints": ["Low risk tolerance"],
    "steps": [
      {
        "step_number": 1,
        "title": "Check wallet balance",
        "type": "execution",
        "description": "Check the current balance of the wallet",
        "expected_outcome": "Current wallet balance information"
      }
    ],
    "estimated_timeline": "1 minute",
    "success_metrics": ["Wallet balance retrieved"]
  },
  "research": {
    "findings": [
      {
        "topic": "Wallet Balance",
        "summary": "Checking wallet balance is a common operation",
        "relevance_score": 0.9,
        "sources": ["https://example.com/wallet-guide"]
      }
    ],
    "overall_assessment": "The plan is feasible and straightforward"
  },
  "decision": {
    "decision": "approved",
    "reasoning": "The plan is simple and achieves the user intent",
    "risk_assessment": {
      "financial_risk": "low",
      "technical_risk": "low",
      "compliance_risk": "low"
    },
    "improvement_suggestions": []
  },
  "wallet": {
    "success": true,
    "message": "Wallet balance retrieved successfully",
    "address": "0x123456789abcdef",
    "balance": 100.5,
    "explorerUrl": "https://explorer.example.com/address/0x123456789abcdef"
  },
  "status": "completed"
}
```

## Direct Usage of Wallet Tools

### Using the Wallet Agent Tool

```typescript
import { WalletAgentTool } from './agent/tools';

@Injectable()
export class MyService {
  constructor(private readonly walletTool: WalletAgentTool) {}

  async checkBalance() {
    const result = await this.walletTool.execute({ action: 'check_balance' });
    return result;
  }

  async sendTransaction(to: string, data: string = '0x') {
    const result = await this.walletTool.execute({
      action: 'send_transaction',
      parameters: { to, data }
    });
    return result;
  }

  async approveToken(spender: string) {
    const result = await this.walletTool.execute({
      action: 'approve_token',
      parameters: { spender }
    });
    return result;
  }

  async batchTransactions(transactions: Array<{ to: string; value?: string; data?: string }>) {
    const result = await this.walletTool.execute({
      action: 'batch_transactions',
      parameters: { transactions }
    });
    return result;
  }

  async analyzeSafety(request: WalletAgentRequest) {
    const safetyResult = await this.walletTool.analyzeTransactionSafety(request);
    return safetyResult;
  }
}
```

### Using the Plan Generator Tool

```typescript
import { PlanGeneratorTool } from './agent/tools';

@Injectable()
export class MyService {
  constructor(private readonly planGenerator: PlanGeneratorTool) {}

  async generatePlan(userIntent: string, userPreferences?: Record<string, any>) {
    const result = await this.planGenerator.generatePlan({
      userIntent,
      userPreferences
    });
    return result;
  }

  async extractWalletOperations(plan: PlanningResponse) {
    const walletOperation = await this.planGenerator.extractWalletOperations(plan);
    return walletOperation;
  }
}
```

### Using the Wallet Service Directly

```typescript
import { WalletService } from './shared/services/wallet.service';

@Injectable()
export class MyService {
  constructor(private readonly walletService: WalletService) {}

  async getWalletInfo() {
    const address = await this.walletService.getWalletAddress();
    const balance = await this.walletService.getUsdcBalance();
    const explorerUrl = this.walletService.getWalletUrl();
    
    return { address, balance, explorerUrl };
  }

  async sendTransaction(to: string, data: string = '0x') {
    const txHash = await this.walletService.sendTransaction(to, data);
    const explorerUrl = this.walletService.getTransactionUrl(txHash);
    
    return { txHash, explorerUrl };
  }
}
```

## Example Wallet Operations

### Check Balance

```typescript
const result = await walletTool.execute({ action: 'check_balance' });
console.log(`Wallet balance: ${result.data?.balance} USDC`);
console.log(`Wallet address: ${result.data?.address}`);
console.log(`Explorer URL: ${result.data?.explorerUrl}`);
```

### Send Transaction

```typescript
const result = await walletTool.execute({
  action: 'send_transaction',
  parameters: {
    to: '0xRecipientAddress',
    data: '0x1234' // Optional data
  }
});

if (result.success) {
  console.log(`Transaction sent: ${result.data?.transactionHash}`);
  console.log(`Explorer URL: ${result.data?.explorerUrl}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Approve Token

```typescript
const result = await walletTool.execute({
  action: 'approve_token',
  parameters: {
    spender: '0xSpenderAddress'
  }
});

if (result.success) {
  console.log(`Approval transaction sent: ${result.data?.transactionHash}`);
  console.log(`Explorer URL: ${result.data?.explorerUrl}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Batch Transactions

```typescript
const result = await walletTool.execute({
  action: 'batch_transactions',
  parameters: {
    transactions: [
      { to: '0xRecipient1', value: '1000000', data: '0x1234' },
      { to: '0xRecipient2', data: '0x5678' }
    ]
  }
});

if (result.success) {
  console.log(`Batch transaction sent: ${result.data?.transactionHash}`);
  console.log(`Explorer URL: ${result.data?.explorerUrl}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

## Error Handling

All wallet operations return a consistent response structure:

```typescript
interface WalletAgentResponse {
  success: boolean;
  message: string;
  data?: {
    address?: string;
    balance?: number;
    transactionHash?: string;
    explorerUrl?: string;
  };
  error?: string;
}
```

Always check the `success` field before accessing the data:

```typescript
const result = await walletTool.execute({ action: 'check_balance' });

if (result.success) {
  // Access result.data safely
  console.log(`Balance: ${result.data?.balance}`);
} else {
  // Handle error
  console.error(`Error: ${result.error}`);
}
```
