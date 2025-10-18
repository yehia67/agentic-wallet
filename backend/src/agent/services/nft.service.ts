import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { MintNFTDto, MintNFTResponseDto } from '../dto/nft-mint.dto';

// PromptNFT contract ABI
const PROMPT_NFT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'string', name: 'uri', type: 'string' },
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'string', name: 'category', type: 'string' },
          { internalType: 'string[]', name: 'tags', type: 'string[]' },
          { internalType: 'uint256', name: 'complexity', type: 'uint256' },
          { internalType: 'bool', name: 'isPublic', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
        ],
        internalType: 'struct PromptNFT.PromptMetadata',
        name: 'metadata',
        type: 'tuple',
      },
      { internalType: 'uint256', name: 'royaltyPercentage', type: 'uint256' },
      { internalType: 'uint256', name: 'subscriptionPrice', type: 'uint256' },
    ],
    name: 'mintPrompt',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'promptMetadata',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'string', name: 'category', type: 'string' },
          { internalType: 'string[]', name: 'tags', type: 'string[]' },
          { internalType: 'uint256', name: 'complexity', type: 'uint256' },
          { internalType: 'bool', name: 'isPublic', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
        ],
        internalType: 'struct PromptNFT.PromptMetadata',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

@Injectable()
export class NFTService {
  private readonly logger = new Logger(NFTService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      // Initialize provider for Base Sepolia
      this.provider = new ethers.JsonRpcProvider('https://sepolia.base.org');

      // Initialize wallet with private key
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }

      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Initialize contract (you'll need to deploy and set the contract address)
      const contractAddress = process.env.PROMPT_NFT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        this.logger.warn(
          'PROMPT_NFT_CONTRACT_ADDRESS not set, NFT minting will not work',
        );
        return;
      }

      this.contract = new ethers.Contract(
        contractAddress,
        PROMPT_NFT_ABI,
        this.wallet,
      );

      this.logger.log('NFT Service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize NFT service: ${error.message}`);
    }
  }

  async mintNFT(mintDto: MintNFTDto): Promise<MintNFTResponseDto> {
    try {
      if (!this.contract) {
        return {
          success: false,
          error:
            'NFT contract not initialized. Please set PROMPT_NFT_CONTRACT_ADDRESS environment variable.',
        };
      }

      // Validate input data
      if (!mintDto.metadata) {
        return {
          success: false,
          error: 'Metadata is required',
        };
      }

      if (!mintDto.metadata.name) {
        return {
          success: false,
          error: 'Metadata name is required',
        };
      }

      // Validate Ethereum address
      if (!ethers.isAddress(mintDto.to)) {
        return {
          success: false,
          error: 'Invalid Ethereum address provided',
        };
      }

      // Create metadata URI (in production, you'd upload to IPFS)
      const metadataJson = JSON.stringify({
        name: mintDto.metadata.name,
        description: mintDto.metadata.description,
        prompt: mintDto.metadata.prompt, // Include the actual AI prompt text
        image:
          mintDto.metadata.image ||
          'https://via.placeholder.com/400x400?text=AI+Prompt+NFT',
        external_url: mintDto.metadata.external_url,
        category: mintDto.metadata.category,
        tags: mintDto.metadata.tags,
        complexity: mintDto.metadata.complexity,
        isPublic: mintDto.metadata.isPublic,
        attributes: [
          {
            trait_type: 'Category',
            value: mintDto.metadata.category,
          },
          {
            trait_type: 'Complexity',
            value: mintDto.metadata.complexity,
          },
          {
            trait_type: 'Public',
            value: mintDto.metadata.isPublic ? 'Yes' : 'No',
          },
          ...(mintDto.metadata.tags?.map((tag) => ({
            trait_type: 'Tag',
            value: tag,
          })) || []),
        ],
      });

      // Log the metadata JSON to confirm prompt is included
      this.logger.log('Metadata JSON for tokenURI:', metadataJson);

      // For demo purposes, we'll use a data URI. In production, upload to IPFS
      const metadataUri = `data:application/json;base64,${Buffer.from(
        metadataJson,
      ).toString('base64')}`;

      this.logger.log('Generated tokenURI:', metadataUri);

      // Prepare contract metadata struct
      const contractMetadata = {
        name: mintDto.metadata.name,
        description: mintDto.metadata.description,
        category: mintDto.metadata.category,
        tags: mintDto.metadata.tags,
        complexity: mintDto.metadata.complexity,
        isPublic: mintDto.metadata.isPublic,
        createdAt: 0, // Will be set by contract
      };

      // Convert subscription price from ETH string to wei
      const subscriptionPriceWei = ethers.parseEther(
        mintDto.subscriptionPrice || '0',
      );

      this.logger.log(
        `Minting NFT for ${mintDto.to} with metadata: ${mintDto.metadata.name}`,
      );

      // Call the contract
      const tx = await this.contract.mintPrompt(
        mintDto.to,
        metadataUri,
        contractMetadata,
        mintDto.royaltyPercentage || 250,
        subscriptionPriceWei,
      );

      this.logger.log(`Transaction submitted: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Extract token ID from logs
      let tokenId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed?.name === 'PromptMinted') {
            tokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch (e) {
          // Ignore parsing errors for other logs
        }
      }

      const explorerUrl = `${process.env.BASE_SCAN_EXPLORER}/tx/${tx.hash}`;

      // Build response object conditionally
      const response: any = {
        success: true,
        transactionHash: tx.hash,
        explorerUrl,
        message:
          tokenId !== undefined
            ? `NFT minted successfully! Token ID: ${tokenId}`
            : 'NFT minted successfully! Check the transaction for token ID.',
      };

      // Only include tokenId if it's defined
      if (tokenId !== undefined) {
        response.tokenId = tokenId;
      }

      return response;
    } catch (error) {
      this.logger.error(`Error minting NFT: ${error.message}`, error.stack);

      let errorMessage = 'Failed to mint NFT';
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message.includes('nonce')) {
        errorMessage = 'Transaction nonce error, please try again';
      } else if (error.message.includes('gas')) {
        errorMessage =
          'Gas estimation failed, please check contract parameters';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getWalletInfo(): Promise<{ address: string; balance: string }> {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      const balance = await this.provider.getBalance(this.wallet.address);

      return {
        address: this.wallet.address,
        balance: ethers.formatEther(balance),
      };
    } catch (error) {
      this.logger.error(`Error getting wallet info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get NFT metadata from contract
   */
  async getNFTMetadata(tokenId: string) {
    try {
      this.logger.log(`Getting metadata for token ID: ${tokenId}`);

      // First, get the tokenURI which contains the JSON metadata
      const tokenURI = await this.contract.tokenURI(tokenId);

      if (!tokenURI) {
        throw new Error('No tokenURI found for this token');
      }

      this.logger.log(`TokenURI: ${tokenURI}`);

      // Parse the tokenURI - it could be a data URI or HTTP URL
      let metadataJson;

      if (tokenURI.startsWith('data:application/json;base64,')) {
        // Decode base64 JSON
        const base64Data = tokenURI.replace(
          'data:application/json;base64,',
          '',
        );
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        metadataJson = JSON.parse(jsonString);
      } else if (tokenURI.startsWith('http')) {
        // Fetch from HTTP URL
        const response = await fetch(tokenURI);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata from ${tokenURI}`);
        }
        metadataJson = await response.json();
      } else if (tokenURI.startsWith('ipfs://')) {
        // Convert IPFS to HTTP and fetch
        const httpUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const response = await fetch(httpUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata from IPFS: ${httpUrl}`);
        }
        metadataJson = await response.json();
      } else {
        // Try to parse as direct JSON
        metadataJson = JSON.parse(tokenURI);
      }

      // Use the metadata from tokenURI - it already contains everything we need
      const combinedMetadata = {
        // From tokenURI JSON
        name: metadataJson.name,
        description: metadataJson.description,
        prompt: metadataJson.prompt, // No fallback - return undefined if missing
        image: metadataJson.image, // This is what we need!
        external_url: metadataJson.external_url,
        attributes: metadataJson.attributes,

        // Also from tokenURI (the JSON contains these fields too)
        category: metadataJson.category,
        tags: metadataJson.tags,
        complexity: metadataJson.complexity,
        isPublic: metadataJson.isPublic,
        createdAt: metadataJson.createdAt,
      };

      this.logger.log(`Combined metadata:`, combinedMetadata);
      return combinedMetadata;
    } catch (error) {
      this.logger.error(
        `Error getting NFT metadata: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
