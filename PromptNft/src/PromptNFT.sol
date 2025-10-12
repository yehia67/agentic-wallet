// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PromptNFT
 * @dev NFT contract for AI prompt chains with royalty support
 * @notice Allows creators to mint NFTs representing custom AI prompt chains
 *         and earn royalties when their prompts are used, shared, or subscribed to
 */
contract PromptNFT is ERC721, ERC721URIStorage, ERC721Burnable, IERC2981, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // State variables
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from token ID to creator address
    mapping(uint256 => address) public promptCreators;
    
    // Mapping from token ID to royalty percentage (basis points, e.g., 250 = 2.5%)
    mapping(uint256 => uint256) public royaltyPercentages;
    
    // Mapping from token ID to prompt metadata
    mapping(uint256 => PromptMetadata) public promptMetadata;
    
    // Mapping from token ID to usage statistics
    mapping(uint256 => UsageStats) public usageStats;
    
    // Mapping from user to subscription status for a prompt
    mapping(address => mapping(uint256 => bool)) public subscriptions;
    
    // Mapping from token ID to subscription price
    mapping(uint256 => uint256) public subscriptionPrices;
    
    // Platform fee percentage (basis points)
    uint256 public platformFeePercentage = 250; // 2.5%
    
    // Maximum royalty percentage (basis points)
    uint256 public constant MAX_ROYALTY_PERCENTAGE = 1000; // 10%
    
    // Structs
    struct PromptMetadata {
        string name;
        string description;
        string category;
        string[] tags;
        uint256 complexity;
        bool isPublic;
        uint256 createdAt;
    }
    
    struct UsageStats {
        uint256 totalUses;
        uint256 totalSubscribers;
        uint256 totalRevenue;
        uint256 lastUsed;
    }
    
    // Events
    event PromptMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 royaltyPercentage
    );
    
    event PromptUsed(
        uint256 indexed tokenId,
        address indexed user,
        uint256 fee
    );
    
    event SubscriptionPurchased(
        uint256 indexed tokenId,
        address indexed subscriber,
        uint256 price
    );
    
    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount
    );
    
    // Constructor
    constructor() ERC721("PromptNFT", "PNFT") {}
    
    /**
     * @dev Mint a new prompt NFT
     * @param to Address to mint the NFT to
     * @param uri Metadata URI for the NFT
     * @param metadata Prompt metadata
     * @param royaltyPercentage Royalty percentage in basis points (max 1000 = 10%)
     * @param subscriptionPrice Price for subscribing to this prompt (0 if free)
     */
    function mintPrompt(
        address to,
        string memory uri,
        PromptMetadata memory metadata,
        uint256 royaltyPercentage,
        uint256 subscriptionPrice
    ) public returns (uint256) {
        require(royaltyPercentage <= MAX_ROYALTY_PERCENTAGE, "Royalty too high");
        require(bytes(metadata.name).length > 0, "Name required");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Set prompt data
        promptCreators[tokenId] = to;
        royaltyPercentages[tokenId] = royaltyPercentage;
        subscriptionPrices[tokenId] = subscriptionPrice;
        
        // Set metadata
        metadata.createdAt = block.timestamp;
        promptMetadata[tokenId] = metadata;
        
        // Initialize usage stats
        usageStats[tokenId] = UsageStats({
            totalUses: 0,
            totalSubscribers: 0,
            totalRevenue: 0,
            lastUsed: 0
        });
        
        emit PromptMinted(tokenId, to, metadata.name, royaltyPercentage);
        
        return tokenId;
    }
    
    /**
     * @dev Use a prompt and pay usage fee
     * @param tokenId Token ID of the prompt to use
     */
    function usePrompt(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Prompt does not exist");
        require(msg.value > 0, "Usage fee required");
        
        address creator = promptCreators[tokenId];
        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 creatorFee = msg.value - platformFee;
        
        // Update usage stats
        usageStats[tokenId].totalUses++;
        usageStats[tokenId].totalRevenue += msg.value;
        usageStats[tokenId].lastUsed = block.timestamp;
        
        // Pay creator
        if (creatorFee > 0) {
            payable(creator).transfer(creatorFee);
            emit RoyaltyPaid(tokenId, creator, creatorFee);
        }
        
        // Pay platform fee to owner
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        emit PromptUsed(tokenId, msg.sender, msg.value);
    }
    
    /**
     * @dev Subscribe to a prompt
     * @param tokenId Token ID of the prompt to subscribe to
     */
    function subscribeToPrompt(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Prompt does not exist");
        require(!subscriptions[msg.sender][tokenId], "Already subscribed");
        
        uint256 price = subscriptionPrices[tokenId];
        require(msg.value >= price, "Insufficient payment");
        
        subscriptions[msg.sender][tokenId] = true;
        usageStats[tokenId].totalSubscribers++;
        
        if (price > 0) {
            address creator = promptCreators[tokenId];
            uint256 platformFee = (price * platformFeePercentage) / 10000;
            uint256 creatorFee = price - platformFee;
            
            // Pay creator
            if (creatorFee > 0) {
                payable(creator).transfer(creatorFee);
            }
            
            // Pay platform fee
            if (platformFee > 0) {
                payable(owner()).transfer(platformFee);
            }
            
            // Refund excess payment
            if (msg.value > price) {
                payable(msg.sender).transfer(msg.value - price);
            }
        }
        
        emit SubscriptionPurchased(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Update subscription price for a prompt (only creator)
     * @param tokenId Token ID of the prompt
     * @param newPrice New subscription price
     */
    function updateSubscriptionPrice(uint256 tokenId, uint256 newPrice) external {
        require(_exists(tokenId), "Prompt does not exist");
        require(promptCreators[tokenId] == msg.sender, "Not the creator");
        
        subscriptionPrices[tokenId] = newPrice;
    }
    
    /**
     * @dev Update prompt metadata (only creator)
     * @param tokenId Token ID of the prompt
     * @param metadata New metadata
     */
    function updatePromptMetadata(uint256 tokenId, PromptMetadata memory metadata) external {
        require(_exists(tokenId), "Prompt does not exist");
        require(promptCreators[tokenId] == msg.sender, "Not the creator");
        require(bytes(metadata.name).length > 0, "Name required");
        
        // Preserve creation timestamp
        metadata.createdAt = promptMetadata[tokenId].createdAt;
        promptMetadata[tokenId] = metadata;
    }
    
    /**
     * @dev Set platform fee percentage (only owner)
     * @param newFeePercentage New fee percentage in basis points
     */
    function setPlatformFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }
    
    /**
     * @dev Check if user is subscribed to a prompt
     * @param user User address
     * @param tokenId Token ID of the prompt
     * @return bool Subscription status
     */
    function isSubscribed(address user, uint256 tokenId) external view returns (bool) {
        return subscriptions[user][tokenId];
    }
    
    /**
     * @dev Get prompt details
     * @param tokenId Token ID of the prompt
     * @return metadata Prompt metadata
     * @return creator Creator address
     * @return stats Usage statistics
     */
    function getPromptDetails(uint256 tokenId) external view returns (
        PromptMetadata memory metadata,
        address creator,
        UsageStats memory stats
    ) {
        require(_exists(tokenId), "Prompt does not exist");
        
        return (
            promptMetadata[tokenId],
            promptCreators[tokenId],
            usageStats[tokenId]
        );
    }
    
    /**
     * @dev Get total number of minted prompts
     * @return uint256 Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    // ERC2981 Royalty Implementation
    
    /**
     * @dev Returns royalty info for a token
     * @param tokenId Token ID
     * @param salePrice Sale price of the token
     * @return receiver Address to receive royalties
     * @return royaltyAmount Amount of royalties
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(tokenId), "Prompt does not exist");
        
        receiver = promptCreators[tokenId];
        royaltyAmount = (salePrice * royaltyPercentages[tokenId]) / 10000;
    }
    
    // Override functions for multiple inheritance
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        // Clean up mappings before burning
        delete promptCreators[tokenId];
        delete royaltyPercentages[tokenId];
        delete promptMetadata[tokenId];
        delete usageStats[tokenId];
        delete subscriptionPrices[tokenId];
        
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
