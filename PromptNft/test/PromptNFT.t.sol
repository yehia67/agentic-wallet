// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/PromptNFT.sol";

contract PromptNFTTest is Test {
    PromptNFT public promptNFT;
    address public owner;
    address public creator;
    address public user;
    address public subscriber;
    
    // Test constants
    uint256 constant ROYALTY_PERCENTAGE = 500; // 5%
    uint256 constant SUBSCRIPTION_PRICE = 0.1 ether;
    uint256 constant USAGE_FEE = 0.01 ether;
    
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
    
    function setUp() public {
        owner = address(this);
        creator = makeAddr("creator");
        user = makeAddr("user");
        subscriber = makeAddr("subscriber");
        
        promptNFT = new PromptNFT();
        
        // Give test accounts some ETH
        vm.deal(creator, 10 ether);
        vm.deal(user, 10 ether);
        vm.deal(subscriber, 10 ether);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
    
    function testMintPrompt() public {
        // Create test metadata
        PromptNFT.PromptMetadata memory metadata = PromptNFT.PromptMetadata({
            name: "DeFi Strategy Prompt",
            description: "Advanced DeFi yield farming strategy",
            category: "DeFi",
            tags: new string[](2),
            complexity: 8,
            isPublic: true,
            createdAt: 0 // Will be set by contract
        });
        metadata.tags[0] = "DeFi";
        metadata.tags[1] = "Yield";
        
        vm.prank(creator);
        vm.expectEmit(true, true, false, true);
        emit PromptMinted(0, creator, "DeFi Strategy Prompt", ROYALTY_PERCENTAGE);
        
        uint256 tokenId = promptNFT.mintPrompt(
            creator,
            "ipfs://QmTest123",
            metadata,
            ROYALTY_PERCENTAGE,
            SUBSCRIPTION_PRICE
        );
        
        // Verify token was minted
        assertEq(tokenId, 0);
        assertEq(promptNFT.ownerOf(tokenId), creator);
        assertEq(promptNFT.promptCreators(tokenId), creator);
        assertEq(promptNFT.royaltyPercentages(tokenId), ROYALTY_PERCENTAGE);
        assertEq(promptNFT.subscriptionPrices(tokenId), SUBSCRIPTION_PRICE);
        
        // Verify metadata
        (PromptNFT.PromptMetadata memory storedMetadata,,) = promptNFT.getPromptDetails(tokenId);
        assertEq(storedMetadata.name, "DeFi Strategy Prompt");
        assertEq(storedMetadata.description, "Advanced DeFi yield farming strategy");
        assertEq(storedMetadata.category, "DeFi");
        assertEq(storedMetadata.complexity, 8);
        assertTrue(storedMetadata.isPublic);
        assertGt(storedMetadata.createdAt, 0);
    }
    
    function testMintPromptWithHighRoyalty() public {
        PromptNFT.PromptMetadata memory metadata = PromptNFT.PromptMetadata({
            name: "Test Prompt",
            description: "Test",
            category: "Test",
            tags: new string[](0),
            complexity: 1,
            isPublic: true,
            createdAt: 0
        });
        
        vm.prank(creator);
        vm.expectRevert("Royalty too high");
        promptNFT.mintPrompt(
            creator,
            "ipfs://test",
            metadata,
            1500, // 15% - too high
            0
        );
    }
    
    function testMintPromptWithoutName() public {
        PromptNFT.PromptMetadata memory metadata = PromptNFT.PromptMetadata({
            name: "",
            description: "Test",
            category: "Test",
            tags: new string[](0),
            complexity: 1,
            isPublic: true,
            createdAt: 0
        });
        
        vm.prank(creator);
        vm.expectRevert("Name required");
        promptNFT.mintPrompt(
            creator,
            "ipfs://test",
            metadata,
            ROYALTY_PERCENTAGE,
            0
        );
    }
    
    function testUsePrompt() public {
        // First mint a prompt
        uint256 tokenId = _mintTestPrompt();
        
        uint256 creatorBalanceBefore = creator.balance;
        uint256 ownerBalanceBefore = owner.balance;
        
        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit PromptUsed(tokenId, user, USAGE_FEE);
        
        promptNFT.usePrompt{value: USAGE_FEE}(tokenId);
        
        // Check balances
        uint256 platformFee = (USAGE_FEE * 250) / 10000; // 2.5%
        uint256 creatorFee = USAGE_FEE - platformFee;
        
        assertEq(creator.balance, creatorBalanceBefore + creatorFee);
        assertEq(owner.balance, ownerBalanceBefore + platformFee);
        
        // Check usage stats
        (,, PromptNFT.UsageStats memory stats) = promptNFT.getPromptDetails(tokenId);
        assertEq(stats.totalUses, 1);
        assertEq(stats.totalRevenue, USAGE_FEE);
        assertGt(stats.lastUsed, 0);
    }
    
    function testUsePromptWithoutFee() public {
        uint256 tokenId = _mintTestPrompt();
        
        vm.prank(user);
        vm.expectRevert("Usage fee required");
        promptNFT.usePrompt(tokenId);
    }
    
    function testUseNonexistentPrompt() public {
        vm.prank(user);
        vm.expectRevert("Prompt does not exist");
        promptNFT.usePrompt{value: USAGE_FEE}(999);
    }
    
    function testSubscribeToPrompt() public {
        uint256 tokenId = _mintTestPrompt();
        
        uint256 creatorBalanceBefore = creator.balance;
        
        vm.prank(subscriber);
        vm.expectEmit(true, true, false, true);
        emit SubscriptionPurchased(tokenId, subscriber, SUBSCRIPTION_PRICE);
        
        promptNFT.subscribeToPrompt{value: SUBSCRIPTION_PRICE}(tokenId);
        
        // Check subscription status
        assertTrue(promptNFT.isSubscribed(subscriber, tokenId));
        
        // Check balances
        uint256 platformFee = (SUBSCRIPTION_PRICE * 250) / 10000; // 2.5%
        uint256 creatorFee = SUBSCRIPTION_PRICE - platformFee;
        
        assertEq(creator.balance, creatorBalanceBefore + creatorFee);
        
        // Check stats
        (,, PromptNFT.UsageStats memory stats) = promptNFT.getPromptDetails(tokenId);
        assertEq(stats.totalSubscribers, 1);
    }
    
    function testSubscribeToPromptWithExcessPayment() public {
        uint256 tokenId = _mintTestPrompt();
        
        uint256 subscriberBalanceBefore = subscriber.balance;
        uint256 excessPayment = 0.05 ether;
        
        vm.prank(subscriber);
        promptNFT.subscribeToPrompt{value: SUBSCRIPTION_PRICE + excessPayment}(tokenId);
        
        // Should refund excess
        assertEq(subscriber.balance, subscriberBalanceBefore - SUBSCRIPTION_PRICE);
    }
    
    function testSubscribeToPromptTwice() public {
        uint256 tokenId = _mintTestPrompt();
        
        vm.prank(subscriber);
        promptNFT.subscribeToPrompt{value: SUBSCRIPTION_PRICE}(tokenId);
        
        vm.prank(subscriber);
        vm.expectRevert("Already subscribed");
        promptNFT.subscribeToPrompt{value: SUBSCRIPTION_PRICE}(tokenId);
    }
    
    function testSubscribeToFreePrompt() public {
        // Mint a free prompt
        PromptNFT.PromptMetadata memory metadata = PromptNFT.PromptMetadata({
            name: "Free Prompt",
            description: "Free strategy",
            category: "Free",
            tags: new string[](0),
            complexity: 1,
            isPublic: true,
            createdAt: 0
        });
        
        vm.prank(creator);
        uint256 tokenId = promptNFT.mintPrompt(
            creator,
            "ipfs://free",
            metadata,
            ROYALTY_PERCENTAGE,
            0 // Free
        );
        
        vm.prank(subscriber);
        promptNFT.subscribeToPrompt(tokenId);
        
        assertTrue(promptNFT.isSubscribed(subscriber, tokenId));
    }
    
    function testUpdateSubscriptionPrice() public {
        uint256 tokenId = _mintTestPrompt();
        uint256 newPrice = 0.2 ether;
        
        vm.prank(creator);
        promptNFT.updateSubscriptionPrice(tokenId, newPrice);
        
        assertEq(promptNFT.subscriptionPrices(tokenId), newPrice);
    }
    
    function testUpdateSubscriptionPriceNotCreator() public {
        uint256 tokenId = _mintTestPrompt();
        
        vm.prank(user);
        vm.expectRevert("Not the creator");
        promptNFT.updateSubscriptionPrice(tokenId, 0.2 ether);
    }
    
    function testUpdatePromptMetadata() public {
        uint256 tokenId = _mintTestPrompt();
        
        PromptNFT.PromptMetadata memory newMetadata = PromptNFT.PromptMetadata({
            name: "Updated Prompt",
            description: "Updated description",
            category: "Updated",
            tags: new string[](1),
            complexity: 9,
            isPublic: false,
            createdAt: 0 // Will be preserved
        });
        newMetadata.tags[0] = "Updated";
        
        vm.prank(creator);
        promptNFT.updatePromptMetadata(tokenId, newMetadata);
        
        (PromptNFT.PromptMetadata memory storedMetadata,,) = promptNFT.getPromptDetails(tokenId);
        assertEq(storedMetadata.name, "Updated Prompt");
        assertEq(storedMetadata.description, "Updated description");
        assertEq(storedMetadata.category, "Updated");
        assertEq(storedMetadata.complexity, 9);
        assertFalse(storedMetadata.isPublic);
        assertGt(storedMetadata.createdAt, 0); // Should be preserved
    }
    
    function testRoyaltyInfo() public {
        uint256 tokenId = _mintTestPrompt();
        uint256 salePrice = 1 ether;
        
        (address receiver, uint256 royaltyAmount) = promptNFT.royaltyInfo(tokenId, salePrice);
        
        assertEq(receiver, creator);
        assertEq(royaltyAmount, (salePrice * ROYALTY_PERCENTAGE) / 10000);
    }
    
    function testSetPlatformFeePercentage() public {
        uint256 newFee = 500; // 5%
        
        promptNFT.setPlatformFeePercentage(newFee);
        assertEq(promptNFT.platformFeePercentage(), newFee);
    }
    
    function testSetPlatformFeePercentageTooHigh() public {
        vm.expectRevert("Fee too high");
        promptNFT.setPlatformFeePercentage(1500); // 15%
    }
    
    function testSetPlatformFeePercentageNotOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        promptNFT.setPlatformFeePercentage(500);
    }
    
    function testTotalSupply() public {
        assertEq(promptNFT.totalSupply(), 0);
        
        _mintTestPrompt();
        assertEq(promptNFT.totalSupply(), 1);
        
        _mintTestPrompt();
        assertEq(promptNFT.totalSupply(), 2);
    }
    
    function testBurnPrompt() public {
        uint256 tokenId = _mintTestPrompt();
        
        vm.prank(creator);
        promptNFT.burn(tokenId);
        
        // Token should no longer exist
        vm.expectRevert("ERC721: invalid token ID");
        promptNFT.ownerOf(tokenId);
        
        // Mappings should be cleaned up
        assertEq(promptNFT.promptCreators(tokenId), address(0));
        assertEq(promptNFT.royaltyPercentages(tokenId), 0);
        assertEq(promptNFT.subscriptionPrices(tokenId), 0);
    }
    
    function testSupportsInterface() public {
        // Test ERC721 interface
        assertTrue(promptNFT.supportsInterface(0x80ac58cd));
        
        // Test ERC2981 interface
        assertTrue(promptNFT.supportsInterface(0x2a55205a));
        
        // Test ERC165 interface
        assertTrue(promptNFT.supportsInterface(0x01ffc9a7));
    }
    
    // Helper function to mint a test prompt
    function _mintTestPrompt() internal returns (uint256) {
        PromptNFT.PromptMetadata memory metadata = PromptNFT.PromptMetadata({
            name: "Test Prompt",
            description: "Test description",
            category: "Test",
            tags: new string[](1),
            complexity: 5,
            isPublic: true,
            createdAt: 0
        });
        metadata.tags[0] = "Test";
        
        vm.prank(creator);
        return promptNFT.mintPrompt(
            creator,
            "ipfs://test",
            metadata,
            ROYALTY_PERCENTAGE,
            SUBSCRIPTION_PRICE
        );
    }
}
