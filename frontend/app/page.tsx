"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [isLaunching, setIsLaunching] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      title: "AI Intelligence",
      description: "Advanced AI that understands your crypto profile, holdings, and investment goals to provide personalized strategies.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-white to-purple-50",
      borderColor: "border-purple-200",
      icon: (
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          <circle cx="9" cy="9" r="1.5"/>
          <circle cx="15" cy="9" r="1.5"/>
          <path d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      )
    },
    {
      title: "Prompt Chain NFTs",
      description: "Mint your AI strategies as NFTs. Share, trade, and earn royalties when others use your successful prompt chains.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-white to-blue-50",
      borderColor: "border-blue-200",
      icon: (
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
          <path d="M12 7L7 9.5v5l5 2.5 5-2.5v-5L12 7z" fill="rgba(255,255,255,0.3)"/>
        </svg>
      )
    },
    {
      title: "On-Chain Intelligence",
      description: "Deep blockchain analysis and DeFi opportunity discovery across multiple chains and protocols.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-white to-green-50",
      borderColor: "border-green-200",
      icon: (
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/>
          <path d="M12 7L7 9.5v5l5 2.5 5-2.5v-5L12 7z" fill="rgba(255,255,255,0.3)"/>
          <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.5)"/>
        </svg>
      )
    },
    {
      title: "Smart Automation",
      description: "Intelligent contract interactions and automated strategies that adapt to market conditions.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-white to-orange-50",
      borderColor: "border-orange-200",
      icon: (
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          <path d="M14 2v6h6" fill="rgba(255,255,255,0.3)"/>
          <path d="M8 13h8M8 17h8M8 9h2" stroke="rgba(255,255,255,0.7)" strokeWidth="1" fill="none"/>
        </svg>
      )
    }
  ];

  const handleLaunchApp = () => {
    setIsLaunching(true);
    // Navigate to dashboard
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-96 h-96 bg-blue-400/10 rounded-full blur-3xl transition-all duration-1000"
          style={{ 
            left: `${mousePosition.x * 0.02}px`, 
            top: `${mousePosition.y * 0.02}px` 
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-purple-400/10 rounded-full blur-3xl transition-all duration-1000"
          style={{ 
            right: `${mousePosition.x * 0.01}px`, 
            bottom: `${mousePosition.y * 0.01}px` 
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-5 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative">
            <Image
              src="/assets/logo.png"
              alt="Agentic Wallet"
              width={48}
              height={48}
              className="rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-blue-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-gray-900 text-2xl font-poppins font-bold tracking-tight">Agentic Wallet</span>
        </div>
        <div className="hidden md:flex space-x-8 text-gray-600 font-inter text-base">
          <a href="#features" className="relative hover:text-blue-600 transition-colors font-medium group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#how-it-works" className="relative hover:text-blue-600 transition-colors font-medium group">
            How it Works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#about" className="relative hover:text-blue-600 transition-colors font-medium group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-32 pb-20 relative">
        <div className="text-center max-w-6xl mx-auto">
          <div className="mb-12 relative inline-block group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse" />
            <Image
              src="/assets/logo.png"
              alt="Agentic Wallet"
              width={120}
              height={120}
              className="relative mx-auto rounded-3xl shadow-2xl ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300 group-hover:scale-105"
            />
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-poppins font-extrabold text-gray-900 mb-8 leading-[1.1] tracking-tight">
            Your Intelligent
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-3 animate-gradient">
              On-Chain Partner
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-12 leading-relaxed font-inter max-w-4xl mx-auto font-light">
            The first wallet that <span className="text-blue-600 font-semibold relative inline-block">
              thinks with you
              <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-400/30 -z-10" />
            </span>. Transform your crypto experience with AI-powered strategies and intelligent opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button
              onClick={handleLaunchApp}
              disabled={isLaunching}
              className="group relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 
                       text-white font-poppins font-bold py-5 px-12 rounded-full text-xl transition-all duration-300 
                       transform hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-xl hover:shadow-2xl hover:shadow-blue-500/40 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center space-x-2">
                {isLaunching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                    <span>Launch App</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </>
                )}
              </span>
            </button>
            
            <a 
              href="#features"
              className="group relative text-gray-700 font-poppins font-semibold py-5 px-12 rounded-full text-xl transition-all duration-300 
                       border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 hover:scale-105 overflow-hidden"
            >
              <span className="absolute inset-0 bg-blue-50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              <span className="relative">Learn More</span>
            </a>
          </div>
        </div>

        {/* Features Slider */}
        <div id="features" className="mt-40">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-poppins font-extrabold text-gray-900 mb-4 tracking-tight">
              Key Features
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            {/* Main Feature Card */}
            <div className="relative h-[500px] mb-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide
                      ? 'opacity-100 scale-100 z-10'
                      : 'opacity-0 scale-95 z-0'
                  }`}
                >
                  <div className={`h-full bg-gradient-to-br ${feature.bgGradient} rounded-[2.5rem] p-12 md:p-16 border-2 ${feature.borderColor} shadow-2xl hover:shadow-3xl transition-shadow duration-500 relative overflow-hidden group`}>
                    {/* Decorative corner elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-bl-[3rem] opacity-50" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/40 to-transparent rounded-tr-[3rem] opacity-50" />
                    
                    <div className="flex flex-col items-center text-center h-full justify-center relative z-10">
                      <div className={`relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-10 flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">{feature.icon}</div>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-poppins font-extrabold text-gray-900 mb-6 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="text-lg md:text-xl text-gray-700 font-inter leading-relaxed max-w-2xl font-light">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-white hover:bg-gray-50 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 z-20"
              aria-label="Previous feature"
            >
              <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-white hover:bg-gray-50 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 z-20"
              aria-label="Next feature"
            >
              <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dot Indicators */}
            <div className="flex justify-center space-x-4">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? 'w-16 h-4 bg-blue-600'
                      : 'w-4 h-4 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to feature ${index + 1}`}
                />
              ))}
            </div>

            {/* Feature Thumbnails */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`group relative p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 ${
                    index === currentSlide
                      ? `${feature.borderColor} bg-gradient-to-br ${feature.bgGradient} shadow-xl scale-105`
                      : 'border-gray-200 bg-white hover:shadow-lg hover:scale-105 hover:border-gray-300'
                  }`}
                >
                  <div className={`relative w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl mb-3 flex items-center justify-center mx-auto transform ${hoveredFeature === index ? 'rotate-6 scale-110' : ''} transition-all duration-300`}>
                    <div className={`absolute inset-0 bg-white/30 rounded-xl blur-md opacity-0 ${hoveredFeature === index ? 'opacity-100' : ''} transition-opacity duration-300`} />
                    <div className="scale-75 relative">{feature.icon}</div>
                  </div>
                  <h4 className="text-sm font-poppins font-bold text-gray-900 leading-tight">
                    {feature.title}
                  </h4>
                  {index === currentSlide && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mt-40">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-poppins font-extrabold text-gray-900 mb-4 tracking-tight">
              Intelligence, Not Automation
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 mx-auto rounded-full" />
          </div>
          
          <div className="relative bg-gradient-to-br from-white to-indigo-50 rounded-[2.5rem] p-10 md:p-16 lg:p-20 border-2 border-indigo-200 shadow-2xl overflow-hidden group">
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
              <div>
                <h3 className="text-3xl md:text-4xl font-poppins font-extrabold text-gray-900 mb-6 tracking-tight">
                  Example: Smart Airdrop Qualification
                </h3>
                <p className="text-lg md:text-xl text-gray-600 font-inter mb-8 leading-relaxed font-light">
                  When Base launches, most tools spam transactions. Agentic Wallet reasons about your value and how you can genuinely contribute.
                </p>
                <div className="space-y-5">
                  <div className="flex items-start space-x-4 group/item">
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex-shrink-0 mt-1 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-sm">1</span>
                      <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-0 group-hover/item:opacity-50 transition-opacity duration-300" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1">Analyze Your Profile</p>
                      <p className="text-base md:text-lg text-gray-600 font-inter font-light">Holdings, skills, and on-chain behavior</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 group/item">
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex-shrink-0 mt-1 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-sm">2</span>
                      <div className="absolute inset-0 bg-indigo-400 rounded-full blur-md opacity-0 group-hover/item:opacity-50 transition-opacity duration-300" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1">Index Ecosystem</p>
                      <p className="text-base md:text-lg text-gray-600 font-inter font-light">Protocols, grants, campaigns, and opportunities</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 group/item">
                    <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex-shrink-0 mt-1 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-sm">3</span>
                      <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-0 group-hover/item:opacity-50 transition-opacity duration-300" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1">Match & Guide</p>
                      <p className="text-base md:text-lg text-gray-600 font-inter font-light">Personalized strategies for meaningful engagement</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 md:p-10 border border-blue-200 shadow-xl">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-poppins font-extrabold text-gray-900 mb-6">Result</div>
                  <div className="space-y-3">
                    <div className="group/result bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl p-4 font-inter text-base md:text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2">
                      <span className="text-xl">✓</span>
                      <span>Real contributions</span>
                    </div>
                    <div className="group/result bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl p-4 font-inter text-base md:text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2">
                      <span className="text-xl">✓</span>
                      <span>Higher airdrop eligibility</span>
                    </div>
                    <div className="group/result bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl p-4 font-inter text-base md:text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2">
                      <span className="text-xl">✓</span>
                      <span>Strong on-chain reputation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Driven DeFi Solutions Section */}
        <div className="mt-40">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-poppins font-extrabold text-gray-900 mb-4 tracking-tight">
              AI-Powered Asset Management
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto rounded-full" />
            <p className="text-lg md:text-xl text-gray-600 font-inter mt-6 max-w-4xl mx-auto font-light leading-relaxed">
              Leveraging ERC-4337 smart contract wallets with AI agents for seamless, automated cross-chain DeFi strategies
            </p>
          </div>

          {/* Main Content Card */}
          <div className="relative bg-gradient-to-br from-white to-green-50 rounded-[2.5rem] p-10 md:p-16 border-2 border-green-200 shadow-2xl overflow-hidden group mb-12">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-3xl md:text-4xl font-poppins font-extrabold text-gray-900 mb-6 tracking-tight">
                  The Problem: CeFi vs. DeFi Complexity
                </h3>
                <p className="text-lg md:text-xl text-gray-600 font-inter leading-relaxed font-light">
                  Users choose centralized finance (CeFi) over non-custodial wallets and DeFi simply because it&apos;s easier. 
                  <span className="font-semibold text-gray-900"> We&apos;re changing that.</span> Agentic Wallet makes DeFi as simple as CeFi while maintaining full custody and control.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-poppins font-bold text-gray-900 mb-2">Smart Gas Optimization</h4>
                      <p className="text-gray-600 font-inter font-light">
                        AI monitors gas costs and market conditions 24/7 to execute transactions at optimal rates across chains
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-poppins font-bold text-gray-900 mb-2">Opportunity Sniping</h4>
                      <p className="text-gray-600 font-inter font-light">
                        Identifies yield opportunities across liquidity pools, re-staking protocols, and bridges automatically
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-poppins font-bold text-gray-900 mb-2">ERC-4337 Integration</h4>
                      <p className="text-gray-600 font-inter font-light">
                        Built on account abstraction standard for seamless smart contract wallet integration and gasless transactions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-poppins font-bold text-gray-900 mb-2">Real-Time Insights</h4>
                      <p className="text-gray-600 font-inter font-light">
                        Continuous wallet performance monitoring with actionable insights and strategy recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Long-Term Investment Strategy */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 rounded-[2.5rem] p-10 md:p-16 border-2 border-blue-200 shadow-2xl overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">💰</span>
                </div>
                <div>
                  <h3 className="text-3xl md:text-4xl font-poppins font-extrabold text-gray-900 tracking-tight">
                    Long-Term Investment Automation
                  </h3>
                  <p className="text-lg text-gray-600 font-inter font-light">Designed for retirement planning and sustainable growth</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-300">
                  <h4 className="text-xl font-poppins font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">1</span>
                    Smart Salary Management
                  </h4>
                  <p className="text-gray-600 font-inter font-light leading-relaxed ml-11">
                    When you receive salary from your employer, the AI agent monitors <span className="font-semibold text-gray-900">ETH prices and gas fees</span> to purchase at optimal rates, maximizing your investment value from day one.
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-300">
                  <h4 className="text-xl font-poppins font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">2</span>
                    Automatic Diversification
                  </h4>
                  <p className="text-gray-600 font-inter font-light leading-relaxed ml-11">
                    Remaining funds are automatically diversified across <span className="font-semibold text-gray-900">different stablecoins</span> and deposited into <span className="font-semibold text-gray-900">liquidity pools across various chains</span>, ensuring balanced exposure and reduced risk.
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-300">
                  <h4 className="text-xl font-poppins font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">3</span>
                    Personalized Strategy Selection
                  </h4>
                  <p className="text-gray-600 font-inter font-light leading-relaxed ml-11">
                    The agent provides curated <span className="font-semibold text-gray-900">DeFi re-staking protocol options</span>. Discuss your investment preferences with the AI, which monitors your chosen products and identifies favorable opportunities while maintaining <span className="font-semibold text-green-600">low risk</span>.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xl">✓</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-poppins font-bold text-gray-900 mb-2">Modular, Non-Tokenized Strategies</h4>
                      <p className="text-gray-700 font-inter font-light leading-relaxed">
                        Subscribe to tailored investment plans designed for <span className="font-semibold">low-risk, long-term growth</span>. No complex tokens to manage—just straightforward, automated wealth building for your retirement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Problem/Solution Section */}
        <div id="about" className="mt-40 grid lg:grid-cols-2 gap-8 md:gap-12">
          <div className="group relative bg-gradient-to-br from-red-50 to-orange-50 rounded-[2.5rem] p-10 md:p-14 border-2 border-red-200 shadow-2xl hover:shadow-red-300/50 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="inline-block mb-6">
                <h3 className="text-4xl md:text-5xl font-poppins font-extrabold text-gray-900 tracking-tight">Why People Choose CeFi</h3>
                <div className="w-16 h-1.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mt-2" />
              </div>
              <p className="text-lg md:text-xl text-gray-600 font-inter mb-8 leading-relaxed font-light">
                Despite the benefits of DeFi, users flock to <span className="font-bold text-red-600">centralized exchanges</span> because:
              </p>
              <div className="space-y-5">
                <div className="group/item relative border-l-4 border-red-400 pl-6 py-2 hover:border-red-500 transition-colors duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-top" />
                  <h4 className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1.5">Overwhelming Complexity</h4>
                  <p className="text-base md:text-lg text-gray-600 font-inter font-light">Managing gas fees, bridging chains, and finding opportunities requires constant attention and expertise</p>
                </div>
                <div className="group/item relative border-l-4 border-red-400 pl-6 py-2 hover:border-red-500 transition-colors duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-top" />
                  <h4 className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1.5">Time-Consuming Research</h4>
                  <p className="text-base md:text-lg text-gray-600 font-inter font-light">Analyzing protocols, comparing yields, and monitoring markets is a full-time job</p>
                </div>
                <div className="group/item relative border-l-4 border-red-400 pl-6 py-2 hover:border-red-500 transition-colors duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-top" />
                  <h4 className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1.5">Custody Trade-off</h4>
                  <p className="text-base md:text-lg text-gray-600 font-inter font-light">Users sacrifice self-custody for convenience, losing control of their assets</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-[2.5rem] p-10 md:p-14 border-2 border-green-200 shadow-2xl hover:shadow-green-300/50 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="inline-block mb-6">
                <h3 className="text-4xl md:text-5xl font-poppins font-extrabold text-gray-900 tracking-tight">DeFi Made Simple</h3>
                <div className="w-16 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2" />
              </div>
              <p className="text-lg md:text-xl text-gray-600 font-inter mb-8 leading-relaxed font-light">
                Agentic Wallet brings <span className="font-bold text-green-600">CeFi simplicity to DeFi</span> while keeping you in control:
              </p>
              <div className="space-y-5">
                <div className="group/item relative border-l-4 border-green-400 pl-6 py-2 hover:border-green-500 transition-colors duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-top" />
                  <h4 className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1.5">AI Handles Complexity</h4>
                  <p className="text-base md:text-lg text-gray-600 font-inter font-light">Automated gas optimization, cross-chain bridging, and opportunity discovery—no manual work required</p>
                </div>
                <div className="group/item relative border-l-4 border-green-400 pl-6 py-2 hover:border-green-500 transition-colors duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-top" />
                  <h4 className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1.5">Smart Contract Wallet</h4>
                  <p className="text-base md:text-lg text-gray-600 font-inter font-light">ERC-4337 integration enables seamless automation while you maintain full custody and control</p>
                </div>
                <div className="group/item relative border-l-4 border-green-400 pl-6 py-2 hover:border-green-500 transition-colors duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-top" />
                  <h4 className="text-xl md:text-2xl text-gray-900 font-poppins font-bold mb-1.5">Set It & Forget It</h4>
                  <p className="text-base md:text-lg text-gray-600 font-inter font-light">Subscribe to personalized strategies and let AI monitor, optimize, and execute—perfect for long-term wealth building</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-200 mt-40 py-16 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-100/30 to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="flex items-center justify-center space-x-4 mb-6 group cursor-pointer">
            <div className="relative">
              <Image
                src="/assets/logo.png"
                alt="Agentic Wallet"
                width={48}
                height={48}
                className="rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-blue-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-gray-900 text-3xl font-poppins font-extrabold tracking-tight">Agentic Wallet</span>
          </div>
          <p className="text-lg md:text-xl text-gray-600 font-inter mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Transform your wallet into a thinking partner. Turn community intelligence into on-chain assets.
          </p>
          <div className="text-gray-500 text-base md:text-lg font-inter">
            Built for <a href="https://base-batches-builder-track.devfolio.co/" className="relative text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300 group/link">
              Base Batches 002: Builder Track
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 scale-x-100 group-hover/link:scale-x-0 transition-transform duration-300 origin-right" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
