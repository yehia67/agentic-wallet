'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { graphqlClient } from '../lib/apollo';
import { GET_COMPREHENSIVE_NFT_DATA } from '../queries/nft.gql';
import { PromptMinted, Transfer, NFTData } from '../types/thegraph';

interface NFTDiscoveryProps {
  className?: string;
}

export default function NFTDiscovery({ className = '' }: NFTDiscoveryProps) {
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const ITEMS_PER_PAGE = 12;

  // Fetch NFT metadata from the contract's promptMetadata mapping
  const fetchNFTMetadata = useCallback(async (tokenId: string): Promise<{
    imageUrl?: string;
    description?: string;
    prompt?: string;
    category?: string;
    tags?: string[];
    complexity?: number;
    isPublic?: boolean;
    external_url?: string;
  }> => {
    try {
      // Call the backend API to get metadata from the contract
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/nft/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenId }),
      });

      if (!response.ok) {
        console.warn(`Failed to fetch metadata for token ${tokenId}, using fallback`);
        // Return fallback data with generated image
        return {
          imageUrl: generateNFTImage({ category: 'general', complexity: 5, name: `NFT #${tokenId}` }, tokenId),
          description: `NFT #${tokenId}`,
          prompt: 'Metadata not available',
          category: 'Unknown',
          tags: [],
          complexity: 5,
          isPublic: true,
          external_url: undefined,
        };
      }

      const contractMetadata = await response.json();
      
      // Use the image from tokenURI metadata, fallback to generated image if not available
      const imageUrl = contractMetadata.image || generateNFTImage(contractMetadata, tokenId);
      
      return {
        imageUrl,
        description: contractMetadata.description || `${contractMetadata.name || `NFT #${tokenId}`} - ${contractMetadata.category || 'Unknown'} prompt`,
        prompt: contractMetadata.prompt || 'No prompt available',
        category: contractMetadata.category || 'Unknown',
        tags: contractMetadata.tags || [],
        complexity: contractMetadata.complexity || 5,
        isPublic: contractMetadata.isPublic !== undefined ? contractMetadata.isPublic : true,
        external_url: contractMetadata.external_url,
      };
    } catch (error) {
      console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
      // Return fallback data instead of empty object
      return {
        imageUrl: generateNFTImage({ category: 'general', complexity: 5, name: `NFT #${tokenId}` }, tokenId),
        description: `NFT #${tokenId}`,
        prompt: 'Metadata not available',
        category: 'Unknown',
        tags: [],
        complexity: 5,
        isPublic: true,
        external_url: undefined,
      };
    }
  }, []);

  // Generate NFT image based on metadata characteristics
  const generateNFTImage = (metadata: { category?: string; complexity?: number; name?: string }, tokenId: string): string => {
    // Create a deterministic image based on metadata properties
    const category = metadata.category || 'general';
    const complexity = metadata.complexity || 1;
    
    // Use a service like Dicebear or generate based on properties
    const seed = `${tokenId}-${category}-${complexity}`;
    
    // For now, use a placeholder service that generates images based on seed
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=random&size=400`;
  };

  // Fetch NFTs from The Graph
  const fetchNFTs = useCallback(async (page = 0, search = '') => {
    try {
      setLoading(true);
      setError(null);

      const skip = page * ITEMS_PER_PAGE;
      const variables = {
        first: ITEMS_PER_PAGE,
        skip,
        orderBy: 'blockTimestamp',
        orderDirection: 'desc'
      };

      const data = await graphqlClient.query<{
        promptMinteds: PromptMinted[];
        transfers: Transfer[];
      }>(GET_COMPREHENSIVE_NFT_DATA, variables);

      if (data.promptMinteds) {
        // Process NFT data and find current owners
        const processedNFTs = await Promise.all(
          data.promptMinteds.map(async (nft) => {
            // Find the latest transfer for this token to determine current owner
            const tokenTransfers = data.transfers
              ?.filter(transfer => transfer.tokenId === nft.tokenId)
              ?.sort((a, b) => parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp));
            
            const currentOwner = tokenTransfers?.[0]?.to || nft.creator;

            // Fetch metadata for this NFT
            const metadata = await fetchNFTMetadata(nft.tokenId);

            return {
              tokenId: nft.tokenId,
              name: nft.name,
              creator: nft.creator,
              royaltyPercentage: nft.royaltyPercentage,
              currentOwner,
              mintedAt: new Date(parseInt(nft.blockTimestamp) * 1000).toLocaleDateString(),
              transactionHash: nft.transactionHash,
              imageUrl: metadata.imageUrl,
              description: metadata.description,
              // Additional metadata from contract
              prompt: metadata.prompt,
              category: metadata.category,
              tags: metadata.tags,
              complexity: metadata.complexity,
              isPublic: metadata.isPublic,
              external_url: metadata.external_url,
            } as NFTData;
          })
        );

        // Filter by search term if provided
        const filteredNFTs = search
          ? processedNFTs.filter(nft => 
              nft.name.toLowerCase().includes(search.toLowerCase()) ||
              nft.creator.toLowerCase().includes(search.toLowerCase())
            )
          : processedNFTs;

        if (page === 0) {
          setNfts(filteredNFTs);
        } else {
          setNfts(prev => [...prev, ...filteredNFTs]);
        }

        setHasMore(filteredNFTs.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
    }
  }, [fetchNFTMetadata]);

  useEffect(() => {
    fetchNFTs(0, searchTerm);
    setCurrentPage(0);
  }, [searchTerm, fetchNFTs]);

  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchNFTs(nextPage, searchTerm);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatRoyalty = (royalty: string) => {
    return `${(parseInt(royalty) / 100).toFixed(1)}%`;
  };

  const openModal = (nft: NFTData) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNFT(null);
    setIsModalOpen(false);
    setIsFullScreen(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`${className}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-4">🔍 Discover NFTs</h2>
        <p className="text-gray-600 font-inter mb-6">
          Explore all Prompt NFTs minted on the platform. Search by name or creator address.
        </p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search NFTs by name or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-inter focus:outline-none focus:border-blue-500 pl-12"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-inter">❌ {error}</p>
          <button
            onClick={() => fetchNFTs(0, searchTerm)}
            className="mt-2 text-red-600 hover:text-red-800 font-inter font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && nfts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 font-inter">Loading NFTs...</span>
        </div>
      )}

      {/* NFT Grid */}
      {nfts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {nfts.map((nft) => (
            <div
              key={nft.tokenId}
              onClick={() => openModal(nft)}
              className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 overflow-hidden hover:shadow-lg cursor-pointer"
            >
              {/* NFT Image */}
              <div className="relative h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                {nft.imageUrl ? (
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient background if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl mx-auto mb-2 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 font-inter">NFT #{nft.tokenId}</p>
                    </div>
                  </div>
                )}
                {/* Royalty Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-purple-700 px-2 py-1 rounded-lg text-xs font-inter font-medium shadow-sm">
                  {formatRoyalty(nft.royaltyPercentage)}
                </div>
              </div>

              {/* NFT Content */}
              <div className="p-6">
                {/* NFT Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-poppins font-bold text-gray-900 mb-1 truncate">
                    {nft.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-inter">
                    Token #{nft.tokenId}
                  </p>
                </div>

              {/* Creator & Owner Info */}
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-inter mb-1">Creator</p>
                  <p className="text-sm font-inter font-medium text-gray-800">
                    {truncateAddress(nft.creator)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-inter mb-1">Current Owner</p>
                  <p className="text-sm font-inter font-medium text-gray-800">
                    {truncateAddress(nft.currentOwner || nft.creator)}
                  </p>
                </div>
              </div>

              {/* Mint Date */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-inter mb-1">Minted</p>
                <p className="text-sm font-inter text-gray-700">{nft.mintedAt}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <a
                  href={`https://sepolia.basescan.org/tx/${nft.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-center py-2 px-3 rounded-lg text-sm font-inter font-medium transition-all"
                >
                  View Tx
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(nft.tokenId)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-center py-2 px-3 rounded-lg text-sm font-inter font-medium transition-all"
                >
                  Copy ID
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && nfts.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">
            {searchTerm ? 'No NFTs found' : 'No NFTs yet'}
          </h3>
          <p className="text-gray-600 font-inter">
            {searchTerm 
              ? `No NFTs match "${searchTerm}". Try a different search term.`
              : 'No NFTs have been minted yet. Be the first to create one!'
            }
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && nfts.length > 0 && !loading && (
        <div className="text-center">
          <button
            onClick={loadMore}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-poppins font-bold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Load More NFTs
          </button>
        </div>
      )}

      {/* Loading More */}
      {loading && nfts.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {/* NFT Details Modal */}
      {isModalOpen && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-3xl w-full overflow-y-auto transition-all duration-300 ${
            isFullScreen 
              ? 'max-w-none max-h-none h-full m-0 rounded-none' 
              : 'max-w-4xl max-h-[90vh]'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-poppins font-bold text-gray-900">NFT Details</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFullScreen}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullScreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0 0l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className={`grid gap-8 ${
                isFullScreen 
                  ? 'grid-cols-1 xl:grid-cols-2' 
                  : 'grid-cols-1 lg:grid-cols-2'
              }`}>
                {/* Left Column - Image */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {selectedNFT.imageUrl ? (
                      <img
                        src={selectedNFT.imageUrl}
                        alt={selectedNFT.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                            </svg>
                          </div>
                          <p className="text-gray-500 font-inter">NFT #{selectedNFT.tokenId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-2">{selectedNFT.name}</h3>
                    <p className="text-gray-600 font-inter mb-4">{selectedNFT.description}</p>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-inter font-medium">
                        {formatRoyalty(selectedNFT.royaltyPercentage)} Royalty
                      </span>
                      {selectedNFT.category && (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-inter font-medium">
                          {selectedNFT.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prompt Section */}
                  {selectedNFT.prompt && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                      <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-3">🤖 AI Prompt</h4>
                      <div className={`bg-white rounded-xl p-4 border border-blue-200 overflow-y-auto ${
                        isFullScreen ? 'max-h-[60vh]' : 'max-h-96'
                      }`}>
                        <div className="text-gray-800 font-inter leading-relaxed prose prose-sm max-w-none
                          prose-headings:text-gray-900 prose-headings:font-poppins
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200
                          prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50
                          prose-ul:list-disc prose-ol:list-decimal
                          prose-li:marker:text-blue-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedNFT.prompt}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedNFT.tags && selectedNFT.tags.length > 0 && (
                    <div>
                      <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-3">🏷️ Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedNFT.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-inter"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 font-inter mb-1">Token ID</p>
                      <p className="text-lg font-inter font-semibold text-gray-900">#{selectedNFT.tokenId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-inter mb-1">Complexity</p>
                      <p className="text-lg font-inter font-semibold text-gray-900">{selectedNFT.complexity || 'N/A'}/10</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-inter mb-1">Creator</p>
                      <p className="text-lg font-inter font-semibold text-gray-900">{truncateAddress(selectedNFT.creator)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-inter mb-1">Current Owner</p>
                      <p className="text-lg font-inter font-semibold text-gray-900">{truncateAddress(selectedNFT.currentOwner || selectedNFT.creator)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <a
                      href={`https://sepolia.basescan.org/tx/${selectedNFT.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-xl font-inter font-medium transition-all"
                    >
                      View on BaseScan
                    </a>
                    {selectedNFT.external_url && (
                      <a
                        href={selectedNFT.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-3 px-4 rounded-xl font-inter font-medium transition-all"
                      >
                        External Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
