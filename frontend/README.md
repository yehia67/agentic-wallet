# 🎨 Agentic Wallet Frontend

> **Modern Web Interface for AI Prompt NFT Marketplace**  
> Built with Next.js 14, React, and TailwindCSS

## 🌟 Overview

The frontend provides a beautiful, responsive interface for discovering, viewing, and interacting with AI Prompt NFTs. Features include advanced search, detailed NFT modals with Markdown support, and seamless blockchain integration.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend service running on `http://localhost:3001`

### Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main dashboard page
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── NFTDiscovery.tsx   # Main NFT discovery component
│   └── ...               # Other UI components
├── lib/                   # Utilities and configurations
│   ├── apollo.ts          # GraphQL client setup
│   └── ...               # Other utilities
├── queries/               # GraphQL queries
│   └── nft.gql           # NFT-related queries
├── types/                 # TypeScript type definitions
│   └── thegraph.ts       # The Graph API types
└── public/               # Static assets
```

## 🎯 Key Features

### 🔍 NFT Discovery
- **Advanced Search**: Search by name, creator address, or category
- **Real-time Filtering**: Instant results as you type
- **Pagination**: Efficient loading with "Load More" functionality
- **Responsive Grid**: Beautiful card layout on all devices

### 🖼️ NFT Details Modal
- **Full-Screen Mode**: Toggle between normal and full-screen views
- **Markdown Support**: Rich formatting for AI prompts with ReactMarkdown
- **Image Display**: Real NFT images from tokenURI metadata
- **Complete Metadata**: All NFT details including royalties, complexity, tags

### 🎨 UI/UX Features
- **Modern Design**: Clean, professional interface with TailwindCSS
- **Smooth Animations**: CSS transitions and hover effects
- **Mobile Responsive**: Perfect experience on all screen sizes
- **Loading States**: Elegant loading indicators and error handling

## 📡 API Integration

### Backend Services
The frontend integrates with multiple backend services:

```typescript
// NFT Metadata Fetching
POST http://localhost:3001/nft/metadata
Content-Type: application/json
{
  "tokenId": "123"
}

// AI Agent Capabilities
GET http://localhost:3001/agent/capabilities

// AI Query Interface
GET http://localhost:3001/agent/query
```

### GraphQL Integration
Uses The Graph Protocol for blockchain data:

```typescript
// Example: Fetch comprehensive NFT data
const { data } = await client.query({
  query: GET_COMPREHENSIVE_NFT_DATA,
  variables: { first: 12, skip: 0 }
});
```

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14**: React framework with App Router
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application

### Styling & UI
- **TailwindCSS**: Utility-first CSS framework
- **Custom Components**: Handcrafted UI components
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Prepared for theme switching

### Data & State Management
- **Apollo Client**: GraphQL client for The Graph integration
- **React Hooks**: Local state management with useState/useEffect
- **Custom Hooks**: Reusable logic for NFT operations

### Markdown & Content
- **ReactMarkdown**: Render Markdown content in NFT prompts
- **remark-gfm**: GitHub Flavored Markdown support
- **Prose Styling**: Beautiful typography with Tailwind Typography

## 📚 Documentation & Resources

### API Documentation
Explore the backend APIs using the HTTP files:

- **[NFT Endpoints](../docs/api/nft.http)**: NFT minting and metadata operations
  ```http
  ### Mint NFT - Creative Writing Prompt
  POST http://localhost:3001/nft/mint
  Content-Type: application/json
  ```

- **[Agent Endpoints](../docs/api/agent.http)**: AI agent capabilities and queries
  ```http
  ### Get AI capabilities and welcome message
  GET http://localhost:3001/agent/capabilities
  Content-Type: application/json
  ```

### GraphQL Schema
- **[Subgraph Schema](../subgraph/schema.graphql)**: The Graph Protocol schema definitions
- **Query Examples**: See `queries/nft.gql` for GraphQL query patterns

### Smart Contracts
- **Contract ABIs**: Located in `../backend/src/contracts/`
- **Base Sepolia**: All contracts deployed on Base testnet

## 🎨 Component Architecture

### NFTDiscovery Component
The main component handling NFT display and interaction:

```typescript
// Key features:
- Search and filtering
- Pagination with infinite scroll
- Modal state management
- Metadata fetching from backend
- Responsive grid layout
```

### Modal System
Advanced modal with multiple view modes:

```typescript
// Features:
- Full-screen toggle
- Markdown rendering
- Image display with fallbacks
- Responsive layout adaptation
```

## 🔧 Development

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_GRAPH_URL=https://api.studio.thegraph.com/query/...
```

### Code Style
- **ESLint**: Linting with Next.js recommended rules
- **Prettier**: Code formatting (if configured)
- **TypeScript**: Strict type checking enabled

### Testing
```bash
# Run type checking
npm run type-check

# Build verification
npm run build
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
npm run build
# Connect to Vercel dashboard
```

### Other Platforms
The app can be deployed on any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Docker containers

## 🤝 Contributing

### Development Workflow
1. Create a feature branch
2. Make your changes
3. Test thoroughly on different screen sizes
4. Ensure TypeScript compilation passes
5. Submit a pull request

### Component Guidelines
- Use TypeScript for all components
- Follow responsive design principles
- Implement proper loading and error states
- Add proper accessibility attributes

---

**🎯 Ready to explore AI Prompt NFTs? Start the development server and visit http://localhost:3000**
