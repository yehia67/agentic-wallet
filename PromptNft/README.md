# PromptNFT - AI Prompt Chain Creator Economy

**A comprehensive NFT contract for AI prompt chains with built-in royalty support and creator monetization.**

## Overview

PromptNFT enables creators to mint NFTs representing custom AI prompt chains and earn royalties whenever their prompts are used, shared, or subscribed to by others. This creates a transparent, on-chain creator economy layer for AI strategies.

## Features

### 🎨 **NFT Functionality**
- **ERC721 Compliant**: Full NFT standard implementation
- **Metadata Storage**: Rich prompt metadata with IPFS support
- **Burnable**: Creators can burn their NFTs if needed
- **Enumerable**: Track total supply and token ownership

### 💰 **Royalty System (ERC2981)**
- **Creator Royalties**: Automatic royalty payments on secondary sales
- **Configurable Rates**: Up to 10% royalty percentage
- **Marketplace Compatible**: Works with OpenSea, LooksRare, etc.

### 📊 **Usage Tracking & Monetization**
- **Pay-per-Use**: Users pay fees to use prompts
- **Subscriptions**: Monthly/yearly subscription model
- **Usage Analytics**: Track total uses, revenue, and subscribers
- **Platform Fees**: Configurable platform fee (default 2.5%)

### 🔧 **Creator Tools**
- **Metadata Updates**: Creators can update prompt information
- **Pricing Control**: Adjust subscription prices anytime
- **Public/Private**: Control prompt visibility
- **Categorization**: Organize prompts by category and tags

## Smart Contract Architecture

### Core Components

```solidity
struct PromptMetadata {
    string name;           // Prompt name
    string description;    // Detailed description
    string category;       // Category (DeFi, NFT, etc.)
    string[] tags;         // Searchable tags
    uint256 complexity;    // Complexity rating (1-10)
    bool isPublic;         // Public visibility
    uint256 createdAt;     // Creation timestamp
}

struct UsageStats {
    uint256 totalUses;        // Total usage count
    uint256 totalSubscribers; // Subscriber count
    uint256 totalRevenue;     // Total revenue earned
    uint256 lastUsed;         // Last usage timestamp
}
```

### Key Functions

#### **Minting**
```solidity
function mintPrompt(
    address to,
    string memory uri,
    PromptMetadata memory metadata,
    uint256 royaltyPercentage,
    uint256 subscriptionPrice
) public returns (uint256)
```

#### **Usage & Payments**
```solidity
function usePrompt(uint256 tokenId) external payable
function subscribeToPrompt(uint256 tokenId) external payable
```

#### **Creator Management**
```solidity
function updateSubscriptionPrice(uint256 tokenId, uint256 newPrice) external
function updatePromptMetadata(uint256 tokenId, PromptMetadata memory metadata) external
```

## Development Setup

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PromptNft

# Install dependencies
forge install

# Build the project
forge build
```

### Testing

```bash
# Run all tests
forge test

# Run tests with verbose output
forge test -vvv

# Run specific test
forge test --match-test testMintPrompt

# Generate gas report
forge test --gas-report
```

### Deployment

```bash
# Deploy to local network
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key <PRIVATE_KEY>

# Deploy to testnet (e.g., Sepolia)
forge script script/Deploy.s.sol --rpc-url <SEPOLIA_RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify

# Deploy to mainnet
forge script script/Deploy.s.sol --rpc-url <MAINNET_RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
```

## Usage Examples

### 1. Mint a Prompt NFT

```solidity
PromptNFT.PromptMetadata memory metadata = PromptNFT.PromptMetadata({
    name: "DeFi Yield Strategy",
    description: "Advanced yield farming strategy for maximum returns",
    category: "DeFi",
    tags: ["yield-farming", "defi", "strategy"],
    complexity: 8,
    isPublic: true,
    createdAt: 0 // Set by contract
});

uint256 tokenId = promptNFT.mintPrompt(
    msg.sender,
    "ipfs://QmYourMetadataHash",
    metadata,
    500, // 5% royalty
    0.1 ether // Subscription price
);
```

### 2. Use a Prompt

```solidity
// Pay 0.01 ETH to use the prompt
promptNFT.usePrompt{value: 0.01 ether}(tokenId);
```

### 3. Subscribe to a Prompt

```solidity
// Subscribe for 0.1 ETH
promptNFT.subscribeToPrompt{value: 0.1 ether}(tokenId);
```

## Revenue Distribution

### Usage Fees
- **Creator**: 97.5% of usage fee
- **Platform**: 2.5% of usage fee

### Subscription Fees
- **Creator**: 97.5% of subscription fee
- **Platform**: 2.5% of subscription fee

### Secondary Sales (Royalties)
- **Creator**: Up to 10% of sale price (configurable)
- **Marketplace**: Remainder

## Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Only creators can modify their prompts
- **Input Validation**: Comprehensive parameter validation
- **Safe Math**: Built-in overflow protection (Solidity 0.8+)
- **Tested**: Comprehensive test suite with 100% coverage

## Integration Guide

### Frontend Integration

```javascript
// Connect to contract
const promptNFT = new ethers.Contract(contractAddress, abi, signer);

// Mint a prompt
const tx = await promptNFT.mintPrompt(
    userAddress,
    metadataURI,
    metadata,
    royaltyPercentage,
    subscriptionPrice
);

// Listen for events
promptNFT.on('PromptMinted', (tokenId, creator, name, royalty) => {
    console.log(`New prompt minted: ${name} by ${creator}`);
});
```

### IPFS Metadata Schema

```json
{
    "name": "DeFi Yield Strategy",
    "description": "Advanced yield farming strategy",
    "image": "ipfs://QmImageHash",
    "attributes": [
        {
            "trait_type": "Category",
            "value": "DeFi"
        },
        {
            "trait_type": "Complexity",
            "value": 8
        },
        {
            "trait_type": "Total Uses",
            "value": 150
        }
    ],
    "prompt_data": {
        "steps": [...],
        "parameters": {...},
        "expected_output": "..."
    }
}
```

## Test Results

All 20 tests pass successfully:

```
✅ testMintPrompt() - Basic NFT minting functionality
✅ testMintPromptWithHighRoyalty() - Royalty validation
✅ testMintPromptWithoutName() - Input validation
✅ testUsePrompt() - Pay-per-use functionality
✅ testSubscribeToPrompt() - Subscription system
✅ testSubscribeToPromptTwice() - Duplicate subscription prevention
✅ testSubscribeToPromptWithExcessPayment() - Refund mechanism
✅ testSubscribeToFreePrompt() - Free prompt subscriptions
✅ testUpdateSubscriptionPrice() - Creator price control
✅ testUpdatePromptMetadata() - Metadata updates
✅ testRoyaltyInfo() - ERC2981 compliance
✅ testSetPlatformFeePercentage() - Platform fee management
✅ testTotalSupply() - Supply tracking
✅ testBurnPrompt() - NFT burning functionality
✅ testSupportsInterface() - Interface compliance
... and more
```

## Contract Addresses

### Testnets
- **Sepolia**: `TBD`
- **Base Sepolia**: `TBD`

### Mainnets
- **Ethereum**: `TBD`
- **Base**: `TBD`

## Roadmap

### Phase 1 ✅
- [x] Core NFT functionality
- [x] Royalty system (ERC2981)
- [x] Usage tracking
- [x] Subscription model
- [x] Comprehensive testing

### Phase 2 🚧
- [ ] Batch operations
- [ ] Prompt collections
- [ ] Advanced analytics
- [ ] Governance token integration

### Phase 3 📋
- [ ] Cross-chain deployment
- [ ] AI model integration
- [ ] Decentralized prompt marketplace
- [ ] Revenue sharing pools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the AI Creator Economy**
