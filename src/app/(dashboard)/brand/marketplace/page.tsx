"use client";
import { useState, useEffect } from 'react';
import { Search, Filter, Users, Star, MapPin, Eye, MessageCircle, Plus, Zap, ChevronDown, Check } from 'lucide-react';

interface Creator {
  id: string;
  name: string;
  handle: string;
  bio: string;
  location: string;
  platforms: string[];
  followers: {
    total: number;
    breakdown: { [key: string]: number };
  };
  engagement: {
    rate: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
  };
  rating: number;
  reviewCount: number;
  categories: string[];
  verified: boolean;
  recentWork: {
    title: string;
    platform: string;
    metrics: {
      views: number;
      likes: number;
      comments: number;
    };
  }[];
  pricing: {
    min: number;
    max: number;
    currency: string;
  };
  availability: 'available' | 'busy' | 'unavailable';
  responseTime: string;
  completionRate: number;
}

export default function BrandMarketplacePage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockCreators: Creator[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        handle: '@sarahjohnson',
        bio: 'Lifestyle & Fashion Content Creator | Brand Collaborations | Authentic Storytelling',
        location: 'Mumbai, India',
        platforms: ['Instagram', 'YouTube', 'TikTok'],
        followers: {
          total: 125000,
          breakdown: { Instagram: 85000, YouTube: 25000, TikTok: 15000 }
        },
        engagement: {
          rate: 4.8,
          avgLikes: 4200,
          avgComments: 320,
          avgShares: 180
        },
        rating: 4.9,
        reviewCount: 47,
        categories: ['Fashion', 'Lifestyle', 'Beauty'],
        verified: true,
        recentWork: [
          {
            title: 'Summer Fashion Haul',
            platform: 'Instagram',
            metrics: { views: 45000, likes: 5200, comments: 380 }
          },
          {
            title: 'Skincare Routine Video',
            platform: 'YouTube',
            metrics: { views: 28000, likes: 3100, comments: 245 }
          }
        ],
        pricing: { min: 15000, max: 50000, currency: 'INR' },
        availability: 'available',
        responseTime: '< 2 hours',
        completionRate: 98
      },
      {
        id: '2',
        name: 'Tech Reviewer Pro',
        handle: '@techreviewerpro',
        bio: 'Technology Reviews | Gadget Unboxings | Tech Tips & Tutorials',
        location: 'Bangalore, India',
        platforms: ['YouTube', 'Twitter', 'LinkedIn'],
        followers: {
          total: 890000,
          breakdown: { YouTube: 650000, Twitter: 180000, LinkedIn: 60000 }
        },
        engagement: {
          rate: 6.2,
          avgLikes: 12000,
          avgComments: 850,
          avgShares: 420
        },
        rating: 4.7,
        reviewCount: 89,
        categories: ['Technology', 'Reviews', 'Education'],
        verified: true,
        recentWork: [
          {
            title: 'iPhone 15 Pro Review',
            platform: 'YouTube',
            metrics: { views: 125000, likes: 8900, comments: 1200 }
          }
        ],
        pricing: { min: 25000, max: 100000, currency: 'INR' },
        availability: 'busy',
        responseTime: '< 4 hours',
        completionRate: 95
      },
      {
        id: '3',
        name: 'Fitness Guru',
        handle: '@fitnessguru',
        bio: 'Certified Personal Trainer | Nutrition Expert | Fitness Motivation',
        location: 'Delhi, India',
        platforms: ['Instagram', 'YouTube', 'TikTok'],
        followers: {
          total: 450000,
          breakdown: { Instagram: 280000, YouTube: 120000, TikTok: 50000 }
        },
        engagement: {
          rate: 7.1,
          avgLikes: 8500,
          avgComments: 650,
          avgShares: 320
        },
        rating: 4.8,
        reviewCount: 62,
        categories: ['Fitness', 'Health', 'Lifestyle'],
        verified: false,
        recentWork: [
          {
            title: '30-Day Abs Challenge',
            platform: 'Instagram',
            metrics: { views: 85000, likes: 9200, comments: 780 }
          }
        ],
        pricing: { min: 20000, max: 75000, currency: 'INR' },
        availability: 'available',
        responseTime: '< 1 hour',
        completionRate: 99
      }
    ];

    setTimeout(() => {
      setCreators(mockCreators);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creator.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creator.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlatform = selectedPlatform === 'all' || creator.platforms.some(p => p.toLowerCase() === selectedPlatform);
    const matchesCategory = selectedCategory === 'all' || creator.categories.some(cat => cat.toLowerCase() === selectedCategory);
    
    return matchesSearch && matchesPlatform && matchesCategory;
  });

  const sortedCreators = [...filteredCreators].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'followers':
        return b.followers.total - a.followers.total;
      case 'engagement':
        return b.engagement.rate - a.engagement.rate;
      case 'price-low':
        return a.pricing.min - b.pricing.min;
      case 'price-high':
        return b.pricing.max - a.pricing.max;
      default:
        return 0;
    }
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'unavailable':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 6) return 'text-green-600';
    if (rate >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setIsPlatformDropdownOpen(false);
        setIsCategoryDropdownOpen(false);
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const platformOptions = [
    { value: 'all', label: 'All Platforms', icon: '🌐' },
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'youtube', label: 'YouTube', icon: '🎥' },
    { value: 'twitter', label: 'Twitter', icon: '🐦' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: '📂' },
    { value: 'fashion', label: 'Fashion', icon: '👗' },
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'fitness', label: 'Fitness', icon: '💪' },
    { value: 'lifestyle', label: 'Lifestyle', icon: '🌟' },
    { value: 'beauty', label: 'Beauty', icon: '💄' },
    { value: 'food', label: 'Food', icon: '🍽️' },
    { value: 'travel', label: 'Travel', icon: '✈️' }
  ];

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated', icon: '⭐' },
    { value: 'followers', label: 'Most Followers', icon: '👥' },
    { value: 'engagement', label: 'Best Engagement', icon: '📈' },
    { value: 'price-low', label: 'Price: Low to High', icon: '💰' },
    { value: 'price-high', label: 'Price: High to Low', icon: '💎' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Marketplace</h1>
              <p className="mt-2 text-gray-600">Discover talented creators and build meaningful partnerships for your brand</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search creators, categories, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <button className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Filter & Sort</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {/* Platform Filter */}
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left min-w-[160px]"
                  onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                >
                  <span className="text-gray-700">
                    {platformOptions.find(opt => opt.value === selectedPlatform)?.icon} {platformOptions.find(opt => opt.value === selectedPlatform)?.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPlatformDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-2">
                      {platformOptions.map((option) => (
                        <button
                          key={option.value}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded text-left transition-colors"
                          onClick={() => {
                            setSelectedPlatform(option.value);
                            setIsPlatformDropdownOpen(false);
                          }}
                        >
                          <span>{option.icon}</span>
                          <span className="text-sm text-gray-700">{option.label}</span>
                          {selectedPlatform === option.value && (
                            <Check className="w-4 h-4 text-blue-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left min-w-[160px]"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                >
                  <span className="text-gray-700">
                    {categoryOptions.find(opt => opt.value === selectedCategory)?.icon} {categoryOptions.find(opt => opt.value === selectedCategory)?.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isCategoryDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-2">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.value}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded text-left transition-colors"
                          onClick={() => {
                            setSelectedCategory(option.value);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          <span>{option.icon}</span>
                          <span className="text-sm text-gray-700">{option.label}</span>
                          {selectedCategory === option.value && (
                            <Check className="w-4 h-4 text-blue-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Filter */}
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left min-w-[160px]"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                >
                  <span className="text-gray-700">
                    {sortOptions.find(opt => opt.value === sortBy)?.icon} {sortOptions.find(opt => opt.value === sortBy)?.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-2">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded text-left transition-colors"
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortDropdownOpen(false);
                          }}
                        >
                          <span>{option.icon}</span>
                          <span className="text-sm text-gray-700">{option.label}</span>
                          {sortBy === option.value && (
                            <Check className="w-4 h-4 text-blue-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">View:</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <div className="w-4 h-4 flex flex-col gap-0.5">
                    <div className="bg-current h-0.5 rounded"></div>
                    <div className="bg-current h-0.5 rounded"></div>
                    <div className="bg-current h-0.5 rounded"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Discovering amazing creators...</span>
            </div>
          </div>
        )}

        {/* Creators Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCreators.map(creator => (
              <div key={creator.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 p-6 group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {creator.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{creator.name}</h3>
                        {creator.verified && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{creator.handle}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getAvailabilityColor(creator.availability)}`}>
                    {creator.availability}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{creator.bio}</p>

                {/* Location & Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {creator.location}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-semibold">{creator.rating}</span>
                    <span className="text-sm text-gray-500 ml-1">({creator.reviewCount})</span>
                  </div>
                </div>

                {/* Platforms */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {creator.platforms.map(platform => (
                      <span key={platform} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Followers</div>
                    <div className="font-bold text-lg text-gray-900">{formatNumber(creator.followers.total)}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Engagement</div>
                    <div className={`font-bold text-lg ${getEngagementColor(creator.engagement.rate)}`}>
                      {creator.engagement.rate}%
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 uppercase tracking-wide font-medium">Price Range</div>
                  <div className="font-bold text-lg text-green-700">
                    ₹{formatNumber(creator.pricing.min)} - ₹{formatNumber(creator.pricing.max)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 group-hover:shadow-md">
                    <Eye className="w-4 h-4 inline mr-2" />
                    View Profile
                  </button>
                  <button className="px-4 py-3 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

        {/* Empty State */}
        {!loading && sortedCreators.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
              <Users className="w-16 h-16" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or filters to discover more creators.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedPlatform('all');
                setSelectedCategory('all');
                setSortBy('rating');
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Insights Section */}
        {!loading && sortedCreators.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Marketplace Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 font-medium uppercase tracking-wide">Total Creators</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{sortedCreators.length}</div>
                <div className="text-xs text-blue-600 mt-1">Available for collaboration</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 font-medium uppercase tracking-wide">Avg. Engagement</div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {(sortedCreators.reduce((sum, c) => sum + c.engagement.rate, 0) / sortedCreators.length).toFixed(1)}%
                </div>
                <div className="text-xs text-green-600 mt-1">Across all creators</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600 font-medium uppercase tracking-wide">Total Reach</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {formatNumber(sortedCreators.reduce((sum, c) => sum + c.followers.total, 0))}
                </div>
                <div className="text-xs text-purple-600 mt-1">Combined followers</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-600 font-medium uppercase tracking-wide">Avg. Rating</div>
                <div className="text-2xl font-bold text-yellow-900 mt-1">
                  {(sortedCreators.reduce((sum, c) => sum + c.rating, 0) / sortedCreators.length).toFixed(1)}
                </div>
                <div className="text-xs text-yellow-600 mt-1">Creator satisfaction</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}