"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunchApp = () => {
    setIsLaunching(true);
    // TODO: Navigate to the main app interface
    setTimeout(() => {
      setIsLaunching(false);
      // Replace with actual navigation logic
      console.log("Launching Agentic Wallet...");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <Image
            src="/assets/logo.png"
            alt="Agentic Wallet"
            width={48}
            height={48}
            className="rounded-xl shadow-md"
          />
          <span className="text-gray-900 text-2xl font-poppins font-bold">Agentic Wallet</span>
        </div>
        <div className="hidden md:flex space-x-10 text-gray-700 font-inter text-lg">
          <a href="#features" className="hover:text-blue-600 transition-all font-semibold hover:scale-105">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-all font-semibold hover:scale-105">How it Works</a>
          <a href="#about" className="hover:text-blue-600 transition-all font-semibold hover:scale-105">About</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-6xl mx-auto">
          <div className="mb-12 animate-fade-in">
            <Image
              src="/assets/logo.png"
              alt="Agentic Wallet"
              width={120}
              height={120}
              className="mx-auto rounded-3xl shadow-2xl ring-4 ring-blue-100"
            />
          </div>
          
          <h1 className="text-7xl lg:text-9xl font-poppins font-black text-gray-900 mb-10 leading-tight tracking-tight">
            Your Intelligent
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
              On-Chain Partner
            </span>
          </h1>
          
          <p className="text-2xl lg:text-4xl text-gray-600 mb-16 leading-relaxed font-inter max-w-5xl mx-auto">
            The first wallet that <span className="text-blue-600 font-semibold">thinks with you</span>. Transform your crypto experience with 
            AI-powered strategies and intelligent opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handleLaunchApp}
              disabled={isLaunching}
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 
                       text-white font-poppins font-bold py-6 px-14 rounded-2xl text-2xl transition-all duration-300 
                       transform hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-2xl hover:shadow-blue-500/50"
            >
              {isLaunching ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Launching...</span>
                </div>
              ) : (
                "Launch App →"
              )}
            </button>
            
            <a 
              href="#features"
              className="text-gray-700 font-poppins font-semibold py-6 px-14 rounded-2xl text-2xl transition-all duration-300 
                       border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 hover:scale-105"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Slider */}
        <div id="features" className="mt-40">
          <h2 className="text-6xl font-poppins font-black text-gray-900 text-center mb-20">
            Key Features
          </h2>
          <div className="relative overflow-hidden py-8">
            <div className="flex space-x-10 animate-slide">
              <div className="flex-shrink-0 w-[450px] bg-gradient-to-br from-white to-purple-50 rounded-3xl p-12 border-2 border-purple-200 shadow-2xl hover:shadow-purple-300/50 transition-all hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-10 flex items-center justify-center shadow-lg">
                  {/* AI Brain Icon */}
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    <circle cx="9" cy="9" r="1.5"/>
                    <circle cx="15" cy="9" r="1.5"/>
                    <path d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                </div>
                <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-6">AI Intelligence</h3>
                <p className="text-xl text-gray-700 font-inter leading-relaxed">
                  Advanced AI that understands your crypto profile, holdings, and investment goals to provide personalized strategies.
                </p>
              </div>

              <div className="flex-shrink-0 w-[450px] bg-gradient-to-br from-white to-blue-50 rounded-3xl p-12 border-2 border-blue-200 shadow-2xl hover:shadow-blue-300/50 transition-all hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl mb-10 flex items-center justify-center shadow-lg">
                  {/* NFT/Token Icon */}
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    <path d="M12 7L7 9.5v5l5 2.5 5-2.5v-5L12 7z" fill="rgba(255,255,255,0.3)"/>
                  </svg>
                </div>
                <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Prompt Chain NFTs</h3>
                <p className="text-xl text-gray-700 font-inter leading-relaxed">
                  Mint your AI strategies as NFTs. Share, trade, and earn royalties when others use your successful prompt chains.
                </p>
              </div>

              <div className="flex-shrink-0 w-[450px] bg-gradient-to-br from-white to-green-50 rounded-3xl p-12 border-2 border-green-200 shadow-2xl hover:shadow-green-300/50 transition-all hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl mb-10 flex items-center justify-center shadow-lg">
                  {/* Blockchain Icon */}
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/>
                    <path d="M12 7L7 9.5v5l5 2.5 5-2.5v-5L12 7z" fill="rgba(255,255,255,0.3)"/>
                    <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.5)"/>
                  </svg>
                </div>
                <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-6">On-Chain Intelligence</h3>
                <p className="text-xl text-gray-700 font-inter leading-relaxed">
                  Deep blockchain analysis and DeFi opportunity discovery across multiple chains and protocols.
                </p>
              </div>

              <div className="flex-shrink-0 w-[450px] bg-gradient-to-br from-white to-orange-50 rounded-3xl p-12 border-2 border-orange-200 shadow-2xl hover:shadow-orange-300/50 transition-all hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl mb-10 flex items-center justify-center shadow-lg">
                  {/* Smart Contract Icon */}
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <path d="M14 2v6h6" fill="rgba(255,255,255,0.3)"/>
                    <path d="M8 13h8M8 17h8M8 9h2" stroke="rgba(255,255,255,0.7)" strokeWidth="1" fill="none"/>
                  </svg>
                </div>
                <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Smart Automation</h3>
                <p className="text-xl text-gray-700 font-inter leading-relaxed">
                  Intelligent contract interactions and automated strategies that adapt to market conditions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mt-40">
          <h2 className="text-6xl font-poppins font-black text-gray-900 text-center mb-20">
            Intelligence, Not Automation
          </h2>
          
          <div className="bg-gradient-to-br from-white to-indigo-50 rounded-[3rem] p-16 lg:p-20 border-2 border-indigo-200 shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-4xl font-poppins font-bold text-gray-900 mb-8">
                  Example: Smart Airdrop Qualification
                </h3>
                <p className="text-2xl text-gray-700 font-inter mb-10 leading-relaxed font-medium">
                  When Base launches, most tools spam transactions. Agentic Wallet reasons about your value and how you can genuinely contribute.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    <div>
                      <p className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Analyze Your Profile</p>
                      <p className="text-lg text-gray-600 font-inter">Holdings, skills, and on-chain behavior</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    <div>
                      <p className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Index Ecosystem</p>
                      <p className="text-lg text-gray-600 font-inter">Protocols, grants, campaigns, and opportunities</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-700 rounded-full flex-shrink-0 mt-1"></div>
                    <div>
                      <p className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Match & Guide</p>
                      <p className="text-lg text-gray-600 font-inter">Personalized strategies for meaningful engagement</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-10 border border-blue-200">
                <div className="text-center">
                  <div className="text-3xl font-poppins font-bold text-gray-900 mb-8">Result</div>
                  <div className="space-y-4">
                    <div className="bg-green-100 text-green-800 rounded-xl p-4 font-inter text-lg font-semibold">✓ Real contributions</div>
                    <div className="bg-green-100 text-green-800 rounded-xl p-4 font-inter text-lg font-semibold">✓ Higher airdrop eligibility</div>
                    <div className="bg-green-100 text-green-800 rounded-xl p-4 font-inter text-lg font-semibold">✓ Strong on-chain reputation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Problem/Solution Section */}
        <div id="about" className="mt-40 grid lg:grid-cols-2 gap-12">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-[3rem] p-14 border-2 border-red-200 shadow-2xl hover:shadow-red-300/50 transition-all">
            <h3 className="text-5xl font-poppins font-black text-gray-900 mb-10">The Problem</h3>
            <p className="text-2xl text-gray-700 font-inter mb-8 leading-relaxed font-medium">
              Managing crypto today gives you TWO BAD options:
            </p>
            <div className="space-y-6">
              <div className="border-l-4 border-red-400 pl-6">
                <h4 className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Mindless Automation</h4>
                <p className="text-lg text-gray-600 font-inter">Bots that execute without understanding why</p>
              </div>
              <div className="border-l-4 border-red-400 pl-6">
                <h4 className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Manual Overload</h4>
                <p className="text-lg text-gray-600 font-inter">Full control at the cost of time and cognitive burden</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[3rem] p-14 border-2 border-green-200 shadow-2xl hover:shadow-green-300/50 transition-all">
            <h3 className="text-5xl font-poppins font-black text-gray-900 mb-10">The Solution</h3>
            <p className="text-2xl text-gray-700 font-inter mb-8 leading-relaxed font-medium">
              Agentic Wallet is not automation. It is intelligence.
            </p>
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Understands You</h4>
                <p className="text-lg text-gray-600 font-inter">Your behavior, skills, and investment style</p>
              </div>
              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Surfaces Opportunities</h4>
                <p className="text-lg text-gray-600 font-inter">Real ways to grow and contribute, not spam</p>
              </div>
              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-2xl text-gray-900 font-poppins font-semibold mb-2">Learns & Adapts</h4>
                <p className="text-lg text-gray-600 font-inter">Builds sustainable long-term strategies</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-gray-200 mt-40 py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Image
              src="/assets/logo.png"
              alt="Agentic Wallet"
              width={48}
              height={48}
              className="rounded-xl shadow-lg"
            />
            <span className="text-gray-900 text-3xl font-poppins font-black">Agentic Wallet</span>
          </div>
          <p className="text-xl text-gray-600 font-inter mb-8 max-w-2xl mx-auto">
            Transform your wallet into a thinking partner. Turn community intelligence into on-chain assets.
          </p>
          <div className="text-gray-500 text-lg font-inter">
            Built for <a href="https://base-batches-builder-track.devfolio.co/" className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-4">Base Batches 002: Builder Track</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
