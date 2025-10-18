// Get all minted NFTs with pagination
export const GET_ALL_PROMPT_NFTS = `
  query GetAllPromptNFTs($first: Int = 100, $skip: Int = 0, $orderBy: String = "blockTimestamp", $orderDirection: String = "desc") {
    promptMinteds(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      tokenId
      creator
      name
      royaltyPercentage
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get NFTs by creator
export const GET_NFTS_BY_CREATOR = `
  query GetNFTsByCreator($creator: String!, $first: Int = 100, $skip: Int = 0) {
    promptMinteds(
      where: { creator: $creator }
      first: $first
      skip: $skip
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      tokenId
      creator
      name
      royaltyPercentage
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get NFT transfers for ownership tracking
export const GET_NFT_TRANSFERS = `
  query GetNFTTransfers($tokenId: String!, $first: Int = 100) {
    transfers(
      where: { tokenId: $tokenId }
      first: $first
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      from
      to
      tokenId
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get current owners of NFTs
export const GET_CURRENT_OWNERS = `
  query GetCurrentOwners($first: Int = 100, $skip: Int = 0) {
    transfers(
      first: $first
      skip: $skip
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      from
      to
      tokenId
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get NFT usage statistics
export const GET_NFT_USAGE = `
  query GetNFTUsage($tokenId: String!, $first: Int = 100) {
    promptUseds(
      where: { tokenId: $tokenId }
      first: $first
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      tokenId
      user
      fee
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get royalty payments for an NFT
export const GET_ROYALTY_PAYMENTS = `
  query GetRoyaltyPayments($tokenId: String!, $first: Int = 100) {
    royaltyPaids(
      where: { tokenId: $tokenId }
      first: $first
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      tokenId
      creator
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get subscription purchases for an NFT
export const GET_SUBSCRIPTION_PURCHASES = `
  query GetSubscriptionPurchases($tokenId: String!, $first: Int = 100) {
    subscriptionPurchaseds(
      where: { tokenId: $tokenId }
      first: $first
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      tokenId
      subscriber
      price
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get comprehensive NFT data (minting + latest transfer for ownership)
export const GET_COMPREHENSIVE_NFT_DATA = `
  query GetComprehensiveNFTData($first: Int = 50, $skip: Int = 0) {
    promptMinteds(
      first: $first
      skip: $skip
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      tokenId
      creator
      name
      royaltyPercentage
      blockNumber
      blockTimestamp
      transactionHash
    }
    transfers(
      first: 1000
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      from
      to
      tokenId
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Search NFTs by name
export const SEARCH_NFTS_BY_NAME = `
  query SearchNFTsByName($nameContains: String!, $first: Int = 50) {
    promptMinteds(
      where: { name_contains_nocase: $nameContains }
      first: $first
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      id
      tokenId
      creator
      name
      royaltyPercentage
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Get recent activity (all events)
export const GET_RECENT_ACTIVITY = `
  query GetRecentActivity($first: Int = 20) {
    promptMinteds(first: $first, orderBy: "blockTimestamp", orderDirection: "desc") {
      id
      tokenId
      creator
      name
      blockTimestamp
      transactionHash
    }
    promptUseds(first: $first, orderBy: "blockTimestamp", orderDirection: "desc") {
      id
      tokenId
      user
      fee
      blockTimestamp
      transactionHash
    }
    transfers(first: $first, orderBy: "blockTimestamp", orderDirection: "desc") {
      id
      from
      to
      tokenId
      blockTimestamp
      transactionHash
    }
  }
`;
