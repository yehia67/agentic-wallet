// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/PromptNFT.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy PromptNFT contract
        PromptNFT promptNFT = new PromptNFT();
        
        console.log("PromptNFT deployed to:", address(promptNFT));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Contract owner:", promptNFT.owner());
        
        vm.stopBroadcast();
    }
}
