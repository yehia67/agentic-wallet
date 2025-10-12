
# 🧠 PromptNFT Subgraph

This subgraph indexes all minted **PromptNFTs** on the **Base Sepolia** network using **The Graph Protocol**.  
It extracts and stores on-chain metadata from the deployed `PromptNFT` contract, enabling fast and efficient querying via GraphQL.

---

## 🚀 Overview

- **Network:** Base Sepolia  
- **Protocol:** Ethereum  
- **Contract Address:** [`0x1b5a136899c22b388d17736ae04e82c37e485925`](https://sepolia.basescan.org/address/0x1b5a136899c22b388d17736ae04e82c37e485925)
- **Start Block:** `32247507`
- **Contract Name:** `PromptNFT`
- **Generated Using:** `graph init`
- **Language:** AssemblyScript (The Graph mappings)

---

## 🧩 Project Structure

```

prompt-nft/
│
├── subgraph.yaml            # Manifest: sources, entities, and event handlers
├── schema.graphql           # GraphQL schema defining entity structure
├── src/
│   ├── mapping.ts           # Event handlers for contract interactions
│   └── utils.ts             # (Optional) Shared helper logic
├── abis/
│   └── PromptNFT.json       # ABI for the PromptNFT smart contract
├── package.json
└── tsconfig.json

````

---

## 🏗️ Setup

### 1️⃣ Install Dependencies
Make sure Corepack and Yarn are enabled:
```bash
corepack enable
corepack prepare yarn@stable --activate
````

Then install dependencies:

```bash
yarn install
```

### 2️⃣ Generate Types

Generate types from the schema and ABI:

```bash
graph codegen
```

### 3️⃣ Build Subgraph

Compile and prepare for deployment:

```bash
graph build
```

---

## 🌍 Deployment

### Authentication

Log in to your Graph account:

```bash
graph auth --studio <ACCESS_TOKEN>
```

### Deploy to Subgraph Studio

```bash
graph deploy --studio prompt-nft
```

> Replace `prompt-nft` with your subgraph slug on [The Graph Studio](https://thegraph.com/studio/).

---

## 🔍 Querying

Once deployed, you can query it via GraphQL Playground or API endpoint:

Example query:

```graphql
{
  promptNFTs(first: 5, orderBy: tokenId, orderDirection: desc) {
    id
    owner
    tokenURI
    createdAt
  }
}
```

---

## 🧠 Notes

* The subgraph tracks `Transfer`, `Mint`, and `MetadataUpdated` events (depending on ABI).
* Starting block `32247507` ensures indexing begins from the deployment block.
* Supports incremental updates for each new `PromptNFT` mint or metadata change.

---

## 🧰 Useful Commands

| Command                        | Description                            |
| ------------------------------ | -------------------------------------- |
| `graph codegen`                | Generates types from GraphQL schema    |
| `graph build`                  | Builds the subgraph for deployment     |
| `graph deploy --studio <slug>` | Deploys to Graph Studio                |
| `graph test`                   | (Optional) Run unit tests for mappings |

---

## 🪪 License

MIT License © 2025
Developed by **Yehia Tarek**



