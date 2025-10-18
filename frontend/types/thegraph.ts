// The Graph TypeScript interfaces for Prompt NFT subgraph

export interface Approval {
  id: string;
  owner: string;
  approved: string;
  tokenId: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface ApprovalForAll {
  id: string;
  owner: string;
  operator: string;
  approved: boolean;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface BatchMetadataUpdate {
  id: string;
  _fromTokenId: string;
  _toTokenId: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface MetadataUpdate {
  id: string;
  _tokenId: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface OwnershipTransferred {
  id: string;
  previousOwner: string;
  newOwner: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface PromptMinted {
  id: string;
  tokenId: string;
  creator: string;
  name: string;
  royaltyPercentage: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface PromptUsed {
  id: string;
  tokenId: string;
  user: string;
  fee: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface RoyaltyPaid {
  id: string;
  tokenId: string;
  creator: string;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface SubscriptionPurchased {
  id: string;
  tokenId: string;
  subscriber: string;
  price: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface Transfer {
  id: string;
  from: string;
  to: string;
  tokenId: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

// Query response types
export interface PromptMintedsResponse {
  promptMinteds: PromptMinted[];
}

export interface TransfersResponse {
  transfers: Transfer[];
}

export interface PromptUsedsResponse {
  promptUseds: PromptUsed[];
}

export interface RoyaltyPaidsResponse {
  royaltyPaids: RoyaltyPaid[];
}

export interface SubscriptionPurchasedsResponse {
  subscriptionPurchaseds: SubscriptionPurchased[];
}

// Combined NFT data for UI display
export interface NFTData {
  tokenId: string;
  name: string;
  creator: string;
  royaltyPercentage: string;
  currentOwner?: string;
  mintedAt: string;
  transactionHash: string;
  usageCount?: number;
  totalRoyalties?: string;
  subscriptionPrice?: string;
  imageUrl?: string;
  description?: string;
  prompt?: string; // The actual AI prompt text
  category?: string;
  tags?: string[];
  complexity?: number;
  isPublic?: boolean;
  external_url?: string;
}

// Pagination and filtering
export interface QueryVariables {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  where?: Record<string, string | number | boolean>;
}
