"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NFTDiscovery from '../../components/NFTDiscovery';

// Message interfaces
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PlanStep {
  step_number: number;
  title: string;
  type: "research" | "analysis" | "execution";
  description: string;
  expected_outcome: string;
}

interface Plan {
  goal: string;
  constraints: string[];
  steps: PlanStep[];
  estimated_timeline: string;
  success_metrics: string[];
}

interface ResearchFinding {
  topic: string;
  summary: string;
  relevance_score: number;
  sources: string[];
}

interface Research {
  findings: ResearchFinding[];
  overall_assessment: string;
}

interface RiskAssessment {
  financial_risk: "low" | "medium" | "high";
  technical_risk: "low" | "medium" | "high";
  compliance_risk: "low" | "medium" | "high";
}

interface Decision {
  decision: "approved" | "rejected" | "pending";
  reasoning: string;
  risk_assessment: RiskAssessment;
  improvement_suggestions: string[];
}

interface AgentResponse {
  message: string;
  plan?: Plan;
  research?: Research;
  decision?: Decision;
  status: "completed" | "pending" | "failed";
  mode?: AgentMode;
  requiresModeSelection?: boolean;
  suggestedMode?: AgentMode;
}

// Wallet interfaces
interface WalletInfo {
  address: string;
  ethBalance: string;
  usdcBalance?: string;
}

// NFT interfaces
interface NFTMetadata {
  name: string;
  description: string;
  prompt: string;
  category: string;
  tags: string[];
  complexity: number;
  isPublic: boolean;
  image?: string;
  external_url?: string;
}

interface NFTMintParams {
  to: string;
  metadata: NFTMetadata;
  royaltyPercentage?: number;
  subscriptionPrice?: string;
}

// Dashboard mode types
type DashboardMode = "chat" | "action" | "discover";
type ActionTab = "wallet" | "nft" | "agent";
type AgentMode = "auto" | "planning" | "execution";

// Capability interface
interface Capability {
  name: string;
  description: string;
  category: string;
  parameters: string[];
  endpoint: string;
}

export default function Dashboard() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dashboard mode state
  const [mode, setMode] = useState<DashboardMode>("chat");
  const [actionTab, setActionTab] = useState<ActionTab>("wallet");
  
  // Agent mode state
  const [agentMode, setAgentMode] = useState<AgentMode>("auto");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  
  // Wallet state
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transferTo, setTransferTo] = useState("0x10b6D4Ec3CA3C374aa4B5673863305ebE4c4d9c1");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferCurrency, setTransferCurrency] = useState<"eth" | "usdc">("eth");
  
  // NFT state
  const [nftParams, setNftParams] = useState<NFTMintParams>({
    to: "",
    metadata: {
      name: "",
      description: "",
      prompt: "",
      category: "General",
      tags: [],
      complexity: 1,
      isPublic: true,
    },
    royaltyPercentage: 100,
    subscriptionPrice: "0",
  });
  
  // Tag input state
  const [tagInput, setTagInput] = useState("");
  const [availableTags] = useState<string[]>([
    "AI", "Creative", "Writing", "DeFi", "Analysis", "Blockchain",
    "Yield", "Development", "Solidity", "Smart Contracts", "Security",
    "Education", "Learning", "Tutorial", "Chat", "Conversation",
    "Finance", "Trading", "NFT", "Web3"
  ]);
  
  // Agent capabilities
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize welcome message on client side to avoid hydration mismatch
  useEffect(() => {
    setMessages([{
      id: "1",
      role: "assistant" as const,
      content: "🤖 **Welcome to the Agentic Wallet Platform!**\n\nI'm your AI assistant for blockchain and wallet operations. Here's how to get started:\n\n📋 **What I Can Do:**\n• **Planning Agent**: Create detailed plans for your blockchain operations\n• **Research Agent**: Research market data, token information, and DeFi protocols\n• **Judge Agent**: Evaluate transaction safety and provide risk assessments\n• **Wallet Operations**: Execute transactions, check balances, and manage tokens\n• **NFT Minting**: Create and mint custom NFTs with metadata\n\n💡 **How to Use the Chat:**\nSimply describe what you want to do in natural language. I'll create a plan, research the necessary information, evaluate safety, and execute operations if approved.\n\n🚀 **Try These Examples:**\n- \"Check my wallet balance\"\n- \"Send 10 USDC to 0x...\"\n- \"Mint an NFT with custom metadata\"\n- \"Research the best DeFi yield farming opportunities\"\n- \"What are the risks of this transaction?\"\n\n**Ready to help! What would you like to do?**",
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    // Fetch agent capabilities when the dashboard loads
    fetchCapabilities();
    
    // Fetch wallet info when switching to action mode with wallet tab
    if (mode === "action" && actionTab === "wallet") {
      fetchWalletInfo();
    }

    // Fetch NFT wallet info when switching to NFT tab
    if (mode === "action" && actionTab === "nft") {
      fetchNFTWalletInfo();
    }
  }, [mode, actionTab]);

  // Fetch agent capabilities
  const fetchCapabilities = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/agent/capabilities`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch capabilities: ${response.status}`);
      }
      
      const data = await response.json();
      setCapabilities(data.capabilities || []);
      
      // Add a welcome message with capabilities
      if (data.capabilities && data.capabilities.length > 0) {
        const capabilitiesMessage: Message = {
          id: Date.now().toString(),
          role: "assistant" as const,
          content: `I can help you with the following capabilities:\n\n${(data.capabilities as Capability[]).map((cap) => `• **${cap.name}**: ${cap.description}`).join('\n\n')}`,
          timestamp: new Date(),
        };
        setMessages((prev: Message[]) => [...prev, capabilitiesMessage]);
      }
    } catch (error) {
      console.error("Error fetching capabilities:", error);
    }
  };

  // Fetch wallet information
  const fetchWalletInfo = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      // Get wallet address
      const addressResponse = await fetch(`${apiUrl}/wallet/address`);
      if (!addressResponse.ok) throw new Error(`Failed to fetch wallet address: ${addressResponse.status}`);
      const addressData = await addressResponse.json();
      
      // Get ETH balance
      const ethBalanceResponse = await fetch(`${apiUrl}/wallet/balance`);
      if (!ethBalanceResponse.ok) throw new Error(`Failed to fetch ETH balance: ${ethBalanceResponse.status}`);
      const ethBalanceData = await ethBalanceResponse.json();
      
      // Get USDC balance
      const usdcBalanceResponse = await fetch(`${apiUrl}/wallet/balance/usdc`);
      let usdcBalance = "0";
      if (usdcBalanceResponse.ok) {
        const usdcBalanceData = await usdcBalanceResponse.json();
        usdcBalance = usdcBalanceData.balance || "0";
      }
      
      setWalletInfo({
        address: addressData.address,
        ethBalance: ethBalanceData.balance,
        usdcBalance: usdcBalance
      });
    } catch (error) {
      console.error("Error fetching wallet info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch NFT wallet info
  const fetchNFTWalletInfo = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/nft/wallet-info`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFT wallet info: ${response.status}`);
      }
      
      const data = await response.json();
      // Update NFT state with wallet info if needed
      if (data.address) {
        setNftParams((prev: NFTMintParams) => ({
          ...prev,
          to: data.address
        }));
      }
      
    } catch (error) {
      console.error("Error fetching NFT wallet info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/agent/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId,
          mode: agentMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const data: AgentResponse = await response.json();

      // Handle mode selection requirement
      if (data.requiresModeSelection) {
        const modeSelectionMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev: Message[]) => [...prev, modeSelectionMessage]);
        return;
      }

      // Format the response content based on the structure
      let responseContent = data.message || "I'm sorry, I couldn't process that request.";
      
      // Add mode indicator
      if (data.mode) {
        const modeEmoji = data.mode === 'execution' ? '⚡' : '📋';
        const modeText = data.mode === 'execution' ? 'Direct Execution' : 'Planning Mode';
        responseContent = `${modeEmoji} **${modeText}**\n\n${responseContent}`;
      }
      
      // Add plan details if available
      if (data.plan) {
        responseContent += "\n\n📋 **Plan Details:**\n";
        responseContent += `**Goal:** ${data.plan.goal}\n\n`;
        
        if (data.plan.constraints.length > 0) {
          responseContent += "**Constraints:**\n";
          data.plan.constraints.forEach((constraint, idx) => {
            responseContent += `${idx + 1}. ${constraint}\n`;
          });
          responseContent += "\n";
        }
        
        if (data.plan.steps.length > 0) {
          responseContent += "**Steps:**\n";
          data.plan.steps.forEach((step) => {
            responseContent += `\n**Step ${step.step_number}: ${step.title}** (${step.type})\n`;
            responseContent += `${step.description}\n`;
            responseContent += `*Expected outcome:* ${step.expected_outcome}\n`;
          });
          responseContent += "\n";
        }
        
        responseContent += `**Timeline:** ${data.plan.estimated_timeline}\n\n`;
        
        if (data.plan.success_metrics.length > 0) {
          responseContent += "**Success Metrics:**\n";
          data.plan.success_metrics.forEach((metric, idx) => {
            responseContent += `${idx + 1}. ${metric}\n`;
          });
        }
      }
      
      // Add research findings if available
      if (data.research) {
        responseContent += "\n\n🔍 **Research Findings:**\n\n";
        data.research.findings.forEach((finding, idx) => {
          responseContent += `**${idx + 1}. ${finding.topic}** (Relevance: ${finding.relevance_score}/10)\n`;
          responseContent += `${finding.summary}\n\n`;
        });
        responseContent += `**Overall Assessment:** ${data.research.overall_assessment}\n`;
      }
      
      // Add decision details if available
      if (data.decision) {
        responseContent += "\n\n✅ **Decision:**\n";
        responseContent += `**Status:** ${data.decision.decision.toUpperCase()}\n`;
        responseContent += `**Reasoning:** ${data.decision.reasoning}\n\n`;
        responseContent += "**Risk Assessment:**\n";
        responseContent += `- Financial Risk: ${data.decision.risk_assessment.financial_risk}\n`;
        responseContent += `- Technical Risk: ${data.decision.risk_assessment.technical_risk}\n`;
        responseContent += `- Compliance Risk: ${data.decision.risk_assessment.compliance_risk}\n`;
        
        if (data.decision.improvement_suggestions.length > 0) {
          responseContent += "\n**Improvement Suggestions:**\n";
          data.decision.improvement_suggestions.forEach((suggestion, idx) => {
            responseContent += `${idx + 1}. ${suggestion}\n`;
          });
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      let errorContent = "Sorry, I'm having trouble processing your request.";
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        errorContent = `Unable to connect to the server at ${apiUrl}. Please ensure the backend is running.`;
      } else if (error instanceof Error) {
        errorContent = `Error: ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle wallet transfer
  const handleTransfer = async () => {
    if (!transferTo || !transferAmount || isLoading) return;
    
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const endpoint = transferCurrency === "eth" ? 
        `${apiUrl}/wallet/transfer/eth` : 
        `${apiUrl}/wallet/transfer/usdc`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: transferTo,
          amount: transferAmount,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Transfer failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant" as const,
        content: `Transfer successful! Transaction hash: ${data.transactionHash}`,
        timestamp: new Date(),
      };
      
      setMessages((prev: Message[]) => [...prev, successMessage]);
      
      // Reset form
      setTransferTo("");
      setTransferAmount("");
      
      // Refresh wallet info
      fetchWalletInfo();
      
    } catch (error) {
      console.error("Error transferring funds:", error);
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant" as const,
        content: `Error transferring funds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle NFT minting
  const handleMintNFT = async () => {
    if (!nftParams.to || !nftParams.metadata.name || !nftParams.metadata.description || !nftParams.metadata.prompt || isLoading) return;
    
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/nft/mint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nftParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `NFT minting failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant" as const,
        content: `NFT minted successfully! Transaction hash: ${data.transactionHash}`,
        timestamp: new Date(),
      };
      
      setMessages((prev: Message[]) => [...prev, successMessage]);
      
      // Reset form
      setNftParams({
        to: "",
        metadata: {
          name: "",
          description: "",
          prompt: "",
          category: "General",
          tags: [],
          complexity: 1,
          isPublic: true,
        },
        royaltyPercentage: 100,
        subscriptionPrice: "0",
      });
      setTagInput("");
      
    } catch (error) {
      console.error("Error minting NFT:", error);
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant" as const,
        content: `Error minting NFT: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag selection for NFT metadata
  const handleAddTag = (tag: string) => {
    if (tag && !nftParams.metadata.tags.includes(tag)) {
      setNftParams((prev: NFTMintParams) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          tags: [...prev.metadata.tags, tag]
        }
      }));
      setTagInput("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setNftParams((prev: NFTMintParams) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags.filter(tag => tag !== tagToRemove)
      }
    }));
  };
  
  const handleCustomTag = () => {
    const customTag = tagInput.trim();
    if (customTag && !nftParams.metadata.tags.includes(customTag)) {
      handleAddTag(customTag);
    }
  };

  // Update NFT metadata
  const updateNFTMetadata = (field: keyof NFTMetadata, value: string | number | boolean | string[]) => {
    setNftParams((prev: NFTMintParams) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/assets/logo.png"
            alt="Agentic Wallet"
            width={48}
            height={48}
            className="rounded-xl shadow-md"
          />
          <span className="text-gray-900 text-2xl font-poppins font-bold">Agentic Wallet</span>
        </Link>
        <div className="flex items-center space-x-6">
          <span className="text-gray-600 font-inter text-lg">Dashboard</span>
          <Link
            href="/"
            className="text-gray-600 hover:text-blue-600 font-inter text-lg font-semibold transition-colors"
          >
            Home
          </Link>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="container mx-auto px-6 pt-24 pb-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-5xl font-poppins font-black text-gray-900 mb-4">
            Agentic Wallet Dashboard
          </h1>
          <p className="text-xl text-gray-600 font-inter">
            Your intelligent on-chain partner
          </p>
        </div>
        
        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setMode("chat")}
            className={`px-6 py-4 text-lg font-poppins font-bold rounded-xl transition-all ${mode === "chat" ? 
              "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : 
              "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300"}`}
          >
            💬 Chat Mode
          </button>
          <button
            onClick={() => setMode("action")}
            className={`px-6 py-4 text-lg font-poppins font-bold rounded-xl transition-all ${mode === "action" ? 
              "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg" : 
              "bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300"}`}
          >
            ⚡ Action Mode
          </button>
          <button
            onClick={() => setMode("discover")}
            className={`px-6 py-4 text-lg font-poppins font-bold rounded-xl transition-all ${mode === "discover" ? 
              "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" : 
              "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300"}`}
          >
            🔍 NFT Discovery
          </button>
        </div>

        {/* Content Area - Conditionally render based on mode */}
        {mode === "chat" ? (
          /* Chat Interface */
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            {/* Messages Area */}
            <div className="h-[600px] overflow-y-auto p-8 space-y-6">
              {messages.map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-3xl px-6 py-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none text-gray-900">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: (props) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                h2: (props) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                                h3: (props) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                                p: (props) => <p className="mb-2 leading-relaxed" {...props} />,
                                strong: (props) => <strong className="font-bold text-gray-900" {...props} />,
                                em: (props) => <em className="italic text-gray-700" {...props} />,
                                ul: (props) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                ol: (props) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                li: (props) => <li className="ml-2" {...props} />,
                                code: (props) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props} />,
                                pre: (props) => <pre className="bg-gray-200 p-2 rounded overflow-x-auto mb-2" {...props} />,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-lg font-inter leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        <p
                          className={`text-xs mt-2 ${
                            message.role === "user" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Agent Mode Selector */}
            <div className="border-t-2 border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-poppins font-semibold text-gray-700">Agent Mode:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setAgentMode('auto')}
                      className={`px-3 py-1 rounded-lg text-sm font-inter font-medium transition-all ${
                        agentMode === 'auto'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      🤖 Auto
                    </button>
                    <button
                      onClick={() => setAgentMode('execution')}
                      className={`px-3 py-1 rounded-lg text-sm font-inter font-medium transition-all ${
                        agentMode === 'execution'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      ⚡ Execute
                    </button>
                    <button
                      onClick={() => setAgentMode('planning')}
                      className={`px-3 py-1 rounded-lg text-sm font-inter font-medium transition-all ${
                        agentMode === 'planning'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      📋 Plan
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-inter">
                  {agentMode === 'auto' && '🤖 Smart detection'}
                  {agentMode === 'execution' && '⚡ Direct action'}
                  {agentMode === 'planning' && '📋 Strategy & research'}
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setInputMessage('Check my wallet balance')}
                  className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-inter text-gray-600 transition-all"
                >
                  💰 My Balance
                </button>
                <button
                  onClick={() => setInputMessage('What are the best DeFi opportunities?')}
                  className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-inter text-gray-600 transition-all"
                >
                  🌾 DeFi Opportunities
                </button>
                <button
                  onClick={() => setInputMessage('How to accumulate ETH safely?')}
                  className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-inter text-gray-600 transition-all"
                >
                  📈 ETH Strategy
                </button>
                <button
                  onClick={() => setInputMessage('Create a new wallet')}
                  className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-inter text-gray-600 transition-all"
                >
                  🔐 New Wallet
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="flex space-x-4">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about crypto strategies, DeFi, airdrops..."
                  className="flex-1 resize-none rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none px-6 py-4 text-lg font-inter"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                           text-white font-poppins font-bold px-8 rounded-2xl transition-all duration-300 
                           transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-xl hover:shadow-blue-500/50 flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 font-inter mt-3">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        ) : mode === "action" ? (
          /* Action Mode Interface */
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            {/* Action Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActionTab("wallet")}
                  className={`px-6 py-4 text-lg font-poppins font-semibold border-b-2 transition-all ${
                    actionTab === "wallet"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Wallet Operations
                </button>
                <button
                  onClick={() => setActionTab("nft")}
                  className={`px-6 py-4 text-lg font-poppins font-semibold border-b-2 transition-all ${
                    actionTab === "nft"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  NFT Minting
                </button>
                <button
                  onClick={() => setActionTab("agent")}
                  className={`px-6 py-3 rounded-xl font-poppins font-semibold transition-all ${
                    actionTab === "agent"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  🤖 Agent Operations
                </button>
              </div>
            </div>

            {/* Action Content */}
            <div className="p-8">
              {actionTab === "wallet" && (
                <div>
                  <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-6">Wallet Operations</h2>
                  
                  {/* Wallet Info */}
                  {walletInfo ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200">
                      <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-4">Wallet Information</h3>
                      <div className="space-y-3">
                        <p className="font-inter text-gray-800"><span className="font-semibold text-gray-900">Address:</span> {walletInfo.address}</p>
                        <p className="font-inter text-gray-800"><span className="font-semibold text-gray-900">ETH Balance:</span> {walletInfo.ethBalance} ETH</p>
                        <p className="font-inter text-gray-800"><span className="font-semibold text-gray-900">USDC Balance:</span> {walletInfo.usdcBalance} USDC</p>
                      </div>
                      <button
                        onClick={fetchWalletInfo}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-poppins font-semibold px-4 py-2 rounded-lg transition-all"
                      >
                        Refresh Balance
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-2xl p-6 mb-8 text-center">
                      <p className="text-gray-600 mb-4">Wallet information not loaded</p>
                      <button
                        onClick={fetchWalletInfo}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-poppins font-semibold px-4 py-2 rounded-lg transition-all"
                      >
                        Load Wallet Info
                      </button>
                    </div>
                  )}
                  
                  {/* Transfer Form */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                    <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-4">Transfer Funds</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Recipient Address</label>
                        <input
                          type="text"
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="0x..."
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Amount</label>
                        <input
                          type="text"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="0.01"
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Currency</label>
                        <div className="flex space-x-4">
                          <button
                            onClick={() => setTransferCurrency("eth")}
                            className={`px-4 py-2 rounded-lg font-inter font-semibold transition-all ${
                              transferCurrency === "eth"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            ETH
                          </button>
                          <button
                            onClick={() => setTransferCurrency("usdc")}
                            className={`px-4 py-2 rounded-lg font-inter font-semibold transition-all ${
                              transferCurrency === "usdc"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            USDC
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleTransfer}
                        disabled={!transferTo || !transferAmount || isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                                 text-white font-poppins font-bold py-4 rounded-xl transition-all duration-300 
                                 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        {isLoading ? "Processing..." : "Transfer"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {actionTab === "nft" && (
                <div>
                  <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-6">NFT Minting</h2>
                  
                  <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                    <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-4">Mint New NFT</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Recipient Address</label>
                        <input
                          type="text"
                          value={nftParams.to}
                          onChange={(e) => setNftParams({...nftParams, to: e.target.value})}
                          placeholder="0x..."
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={fetchNFTWalletInfo}
                          className="mt-2 text-blue-600 hover:text-blue-800 font-inter text-sm"
                        >
                          Use my wallet address
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">NFT Name</label>
                        <input
                          type="text"
                          value={nftParams.metadata.name}
                          onChange={(e) => updateNFTMetadata("name", e.target.value)}
                          placeholder="My AI Prompt NFT"
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Description</label>
                        <textarea
                          value={nftParams.metadata.description}
                          onChange={(e) => updateNFTMetadata("description", e.target.value)}
                          placeholder="A valuable AI prompt for generating creative content"
                          rows={3}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">AI Prompt Content *</label>
                        <textarea
                          value={nftParams.metadata.prompt}
                          onChange={(e) => updateNFTMetadata("prompt", e.target.value)}
                          placeholder="Enter your AI prompt here. You can use Markdown formatting for better presentation..."
                          rows={8}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                        />
                        <p className="text-sm text-gray-500 mt-1">💡 Supports Markdown: **bold**, *italic*, # headers, lists, code blocks</p>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Category</label>
                        <select
                          value={nftParams.metadata.category}
                          onChange={(e) => updateNFTMetadata("category", e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        >
                          <option value="General">General</option>
                          <option value="Creative">Creative</option>
                          <option value="Finance">Finance</option>
                          <option value="Development">Development</option>
                          <option value="Education">Education</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Tags</label>
                        <div className="space-y-3">
                          {/* Tag Input - Press Enter to Add */}
                          <div>
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCustomTag();
                                }
                              }}
                              placeholder="Type a tag and press Enter..."
                              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">💡 Press Enter to add each tag</p>
                          </div>
                          
                          {/* Selected Tags Display */}
                          {nftParams.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                              {nftParams.metadata.tags.map((tag: string, index: number) => (
                                <span 
                                  key={index} 
                                  className="group inline-flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-2 hover:text-red-200 transition-colors text-lg leading-none"
                                    aria-label={`Remove ${tag} tag`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Quick Add Suggestions */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-2">Quick add popular tags:</label>
                            <div className="flex flex-wrap gap-2">
                              {availableTags.filter(tag => !nftParams.metadata.tags.includes(tag)).slice(0, 8).map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => handleAddTag(tag)}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg text-sm font-medium transition-colors border border-gray-300 hover:border-blue-400"
                                >
                                  + {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Image URL (optional)</label>
                        <input
                          type="text"
                          value={nftParams.metadata.image || ""}
                          onChange={(e) => updateNFTMetadata("image", e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">External URL (optional)</label>
                        <input
                          type="text"
                          value={nftParams.metadata.external_url || ""}
                          onChange={(e) => updateNFTMetadata("external_url", e.target.value)}
                          placeholder="https://agentic-wallet.com/prompts/..."
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Complexity (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={nftParams.metadata.complexity}
                          onChange={(e) => updateNFTMetadata("complexity", parseInt(e.target.value))}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={nftParams.metadata.isPublic}
                          onChange={(e) => updateNFTMetadata("isPublic", e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isPublic" className="ml-2 text-gray-700 font-inter">
                          Make this NFT public
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Royalty Percentage (0-1000 basis points, 100 = 1%)</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={nftParams.royaltyPercentage}
                          onChange={(e) => setNftParams({...nftParams, royaltyPercentage: parseInt(e.target.value)})}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-inter font-medium mb-2">Subscription Price (ETH, 0 for free)</label>
                        <input
                          type="text"
                          value={nftParams.subscriptionPrice}
                          onChange={(e) => setNftParams({...nftParams, subscriptionPrice: e.target.value})}
                          placeholder="0.01"
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <button
                        onClick={handleMintNFT}
                        disabled={!nftParams.to || !nftParams.metadata.name || !nftParams.metadata.description || !nftParams.metadata.prompt || isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                                 text-white font-poppins font-bold py-4 rounded-xl transition-all duration-300 
                                 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        {isLoading ? "Processing..." : "Mint NFT"}
                      </button>
                      {(!nftParams.to || !nftParams.metadata.name || !nftParams.metadata.description || !nftParams.metadata.prompt) && (
                        <p className="text-sm text-red-600 mt-2 text-center">
                          * Please fill in all required fields (Recipient, Name, Description, and Prompt)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {actionTab === "agent" && (
                <div>
                  <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-6">Agent Operations</h2>
                  
                  <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                    <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-4">Agent Capabilities</h3>
                    
                    {capabilities.length > 0 ? (
                      <ul className="space-y-2 mb-6">
                        {capabilities.map((capability: Capability, index: number) => (
                          <li key={index} className="flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                            <span className="font-inter text-gray-800">
                              <strong>{capability.name}</strong>: {capability.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 mb-4">No capabilities loaded</p>
                    )}
                    
                    <button
                      onClick={fetchCapabilities}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-poppins font-semibold px-4 py-2 rounded-lg transition-all"
                    >
                      Refresh Capabilities
                    </button>
                    
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <p className="font-inter text-gray-700 mb-4">
                        For complex operations requiring reasoning, please use the Chat Mode to interact with the AI agent.
                      </p>
                      <button
                        onClick={() => setMode("chat")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                                 text-white font-poppins font-semibold px-6 py-3 rounded-xl transition-all"
                      >
                        Switch to Chat Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* NFT Discovery Mode Interface */
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="p-8">
              <NFTDiscovery />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => {
              setMode("action");
              setActionTab("wallet");
              fetchWalletInfo();
            }}
            className="bg-white hover:bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
              Wallet Operations
            </h3>
            <p className="text-gray-600 font-inter">
              Check balance and transfer funds
            </p>
          </button>

          <button 
            onClick={() => {
              setMode("action");
              setActionTab("nft");
              fetchNFTWalletInfo();
            }}
            className="bg-white hover:bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
              NFT Minting
            </h3>
            <p className="text-gray-600 font-inter">
              Create and mint new NFTs
            </p>
          </button>

          <button 
            onClick={() => {
              setMode("discover");
            }}
            className="bg-white hover:bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
              NFT Discovery
            </h3>
            <p className="text-gray-600 font-inter">
              Explore and discover NFTs
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
