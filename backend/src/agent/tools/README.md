# Agent Tools

This directory contains tools that are used by the agent to perform various tasks.

## Available Tools

### Wallet Agent Tool

The Wallet Agent Tool provides functionality for interacting with the wallet service. It allows the agent to:

- Check wallet balance
- Send transactions
- Approve tokens for spending
- Execute batch transactions
- Analyze transaction safety

### Plan Generator Tool

The Plan Generator Tool helps the agent create and refine plans based on user intent and preferences. It allows the agent to:

- Generate comprehensive plans with clear, actionable steps
- Refine existing plans based on feedback
- Extract wallet operations from plans

## Usage

Tools can be imported from the index file:

```typescript
import { WalletAgentTool, PlanGeneratorTool } from './tools';
```

And injected into services:

```typescript
constructor(
  private readonly walletTool: WalletAgentTool,
  private readonly planGenerator: PlanGeneratorTool,
) {}
```

## Adding New Tools

When adding new tools:

1. Create a new file with the naming convention `tool-name.tool.ts`
2. Export the tool from the `index.ts` file
3. Add the tool to the providers and exports in the `agent.module.ts` file
4. Document the tool in this README
