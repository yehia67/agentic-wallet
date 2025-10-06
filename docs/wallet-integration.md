# Wallet Integration

This document explains how the wallet functionality has been integrated into the agentic system.

## Architecture Overview

The wallet integration consists of several components:

1. **Wallet Service**: Core service that interacts with the blockchain using Pimlico SDK
2. **Wallet Agent Tool**: Tool that the agent uses to interact with the wallet service
3. **Plan Generator Tool**: Tool that helps extract wallet operations from plans

## Component Details

### Wallet Service

Located in `/src/shared/services/wallet.service.ts`, this service:

- Initializes the Pimlico client and smart account
- Provides methods for wallet operations:
  - Getting wallet address and balance
  - Sending transactions
  - Approving tokens
  - Executing batch transactions
- Handles transaction URLs for block explorer integration

The service uses the ERC-4337 account abstraction standard with Pimlico as the bundler and paymaster.

### Wallet Agent Tool

Located in `/src/agent/tools/wallet-agent.tool.ts`, this tool:

- Provides a high-level interface for the agent to interact with the wallet
- Handles safety analysis of transactions using LLM
- Formats responses in a consistent structure
- Provides error handling and logging

### Plan Generator Tool

Located in `/src/agent/tools/plan-generator.tool.ts`, this tool:

- Generates plans based on user intent
- Refines plans based on feedback
- Extracts wallet operations from plans using LLM

## Integration with Agent Workflow

The agent workflow has been updated to:

1. Generate a plan based on user intent
2. Research relevant information
3. Judge the plan based on research
4. Extract wallet operations from the approved plan
5. Execute wallet operations
6. Return results to the user

## Environment Variables

The wallet integration requires the following environment variables:

```
PRIVATE_KEY=<your-pk>
PIMLICO_API_KEY=<your_api_key>
PIMLICO_RPC=<rpc-url>
BASE_SCAN_USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_SCAN_EXPLORER=https://sepolia.basescan.org
```

## Security Considerations

1. **Transaction Safety Analysis**: Before executing any wallet operation, the system analyzes the transaction for safety using LLM.
2. **Error Handling**: Comprehensive error handling ensures that failures are properly reported.
3. **Environment Variables**: Sensitive information like private keys and API keys are stored in environment variables.

## Testing

The wallet integration includes comprehensive tests:

- Unit tests for the wallet service
- Unit tests for the wallet agent tool
- Unit tests for the plan generator tool
- Integration tests for the agent service with wallet operations

## Future Improvements

1. **Multi-wallet Support**: Add support for multiple wallets
2. **Transaction History**: Implement transaction history tracking
3. **Gas Optimization**: Add gas optimization strategies
4. **Enhanced Security**: Implement additional security measures like multi-signature support
5. **Token Support**: Add support for additional tokens beyond USDC
