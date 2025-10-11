"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Agentic Wallet AI assistant. I can help you with crypto strategies, DeFi opportunities, and airdrop qualification. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const data: AgentResponse = await response.json();

      // Format the response content based on the structure
      let responseContent = data.message || "I'm sorry, I couldn't process that request.";
      
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
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
            AI Agent Chat
          </h1>
          <p className="text-xl text-gray-600 font-inter">
            Chat with your intelligent on-chain partner
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          {/* Messages Area */}
          <div className="h-[600px] overflow-y-auto p-8 space-y-6">
            {messages.map((message) => (
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

          {/* Input Area */}
          <div className="border-t-2 border-gray-200 p-6 bg-gradient-to-br from-gray-50 to-blue-50">
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

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-white hover:bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all text-left">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
              Investment Strategies
            </h3>
            <p className="text-gray-600 font-inter">
              Get personalized crypto investment recommendations
            </p>
          </button>

          <button className="bg-white hover:bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all text-left">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
              Airdrop Opportunities
            </h3>
            <p className="text-gray-600 font-inter">
              Discover and qualify for upcoming airdrops
            </p>
          </button>

          <button className="bg-white hover:bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all text-left">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/>
              </svg>
            </div>
            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
              DeFi Analysis
            </h3>
            <p className="text-gray-600 font-inter">
              Analyze DeFi protocols and opportunities
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
