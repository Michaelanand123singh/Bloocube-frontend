"use client";
import { useEffect, useMemo, useState } from 'react';
import { useCampaigns, createCampaign, updateCampaignApi } from '@/hooks/useCampaigns';
import type { Campaign } from '@/types/campaign';
import { acceptBidApi, rejectBidApi } from '@/hooks/useBids';
import { campaignService } from '@/lib/campaignService';
import { authUtils } from '@/lib/auth';
import { ChevronDownIcon, PlusIcon, EyeIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

type PlatformType = "instagram" | "youtube" | "twitter" | "linkedin" | "facebook";

export default function BrandCampaignsPage() {
  const currentUser = authUtils.getUser?.();
  if (!currentUser || (currentUser.role !== 'brand' && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Brand access required</h1>
          <p className="text-sm text-gray-600 mb-4">Please sign in with a brand account to manage campaigns.</p>
        </div>
      </div>
    );
  }
  const { data: campaigns, loading, error, refetch } = useCampaigns({ limit: 10 });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [draft, setDraft] = useState<Partial<Campaign>>({
    title: '',
    description: '',
    budget: 0,
    deadline: '',
    requirements: { platforms: [] },
    payment: { type: 'fixed', amount: 0, currency: 'INR' },
    isPublic: true
  });
  const [publishActive, setPublishActive] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidsError, setBidsError] = useState<string | null>(null);
  const [bids, setBids] = useState<import('@/types/bid').Bid[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    (async () => {
      if (!selectedCampaignId) return;
      try {
        setBidsLoading(true);
        setBidsError(null);
        const res = await campaignService.listBids(selectedCampaignId, { limit: 20 });
        setBids(res.data.bids);
      } catch (e: unknown) {
        const error = e as Error;
        setBidsError(error?.message || 'Failed to load bids');
      } finally {
        setBidsLoading(false);
      }
    })();
  }, [selectedCampaignId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown]')) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const isValid = useMemo(() => {
    const titleOk = (draft.title || '').trim().length >= 5;
    const descOk = (draft.description || '').trim().length >= 10;
    const budgetOk = typeof draft.budget === 'number' && draft.budget >= 1000;
    const platformsOk = (draft.requirements?.platforms?.length || 0) >= 1;
    const deadlineOk = (deadlineDate && deadlineTime) ? (new Date(`${deadlineDate}T${deadlineTime}:00`) > new Date()) : false;
    return titleOk && descOk && budgetOk && platformsOk && deadlineOk;
  }, [draft, deadlineDate, deadlineTime]);

  const invalidReasons = useMemo(() => {
    const reasons: string[] = [];
    if (!draft.title || draft.title.trim().length < 5) reasons.push('Title must be at least 5 characters');
    if (!draft.description || draft.description.trim().length < 10) reasons.push('Description must be at least 10 characters');
    if (!(typeof draft.budget === 'number' && draft.budget >= 1000)) reasons.push('Budget must be at least 1000');
    if (!draft.requirements?.platforms || draft.requirements.platforms.length < 1) reasons.push('Select at least one platform');
    if (!(deadlineDate && deadlineTime && new Date(`${deadlineDate}T${deadlineTime}:00`) > new Date())) reasons.push('Choose a future deadline date and time');
    return reasons;
  }, [draft, deadlineDate, deadlineTime]);

  const onCreate = async () => {
    try {
      setCreating(true);
      setFormError(null);
      if (!isValid) {
        setFormError('Please fill all required fields: Title (≥5), Description (≥10), Budget (≥1000), Platforms (≥1), Future deadline.');
        return;
      }
      console.log('🚀 Creating campaign with draft:', draft, { deadlineDate, deadlineTime });
      // Combine date and time into ISO; fallback to end-of-day if parsing fails
      const combinedDeadline = (() => {
        if (deadlineDate) {
          const dt = new Date(`${deadlineDate}T${deadlineTime || '23:59'}:00`);
          if (!isNaN(dt.getTime())) return dt.toISOString();
        }
        const end = new Date();
        end.setHours(23,59,59,0);
        end.setDate(end.getDate() + 1);
        return end.toISOString();
      })();

      const payload = { 
        ...draft,
        deadline: combinedDeadline,
        payment: { ...(draft.payment as Record<string, unknown>), amount: Number(draft.budget || 0) }
      } as Record<string, unknown>;
      console.log('📦 Payload for POST /api/campaigns:', payload);
      const created = await createCampaign(payload);
      if (publishActive && created && created._id) {
        try {
          await updateCampaignApi(created._id, { status: 'active' } as Record<string, unknown>);
        } catch (e) {
          console.warn('Failed to set campaign active, leaving as draft', e);
        }
      }
      console.log('✅ Created campaign:', created);
      setDraft({ title: '', description: '', budget: 0, deadline: '', requirements: { platforms: [] }, payment: { type: 'fixed', amount: 0, currency: 'INR' }, isPublic: true });
      setDeadlineDate('');
      setDeadlineTime('23:59');
      setPublishActive(true);
      await refetch();
      alert(`Campaign created${publishActive ? ' and published' : ''}: ${created.title}`);
    } catch (e: unknown) {
      const error = e as Error;
      setFormError(error?.message || 'Failed to create campaign');
      console.error('❌ Create campaign failed:', e);
    } finally {
      setCreating(false);
    }
  };

  const user = (authUtils.getUser?.() as Record<string, unknown>) || null;

  const onAccept = async (campaignId: string, bidId: string) => {
    await acceptBidApi(campaignId, bidId);
    // refresh bids
    setSelectedCampaignId(prev => prev); // trigger useEffect
  };
  const onReject = async (campaignId: string, bidId: string) => {
    await rejectBidApi(campaignId, bidId);
    setSelectedCampaignId(prev => prev);
  };

  const platformOptions = [
    { value: 'instagram', label: 'Instagram', icon: '' },
    { value: 'youtube', label: 'YouTube', icon: '🎥' },
    { value: 'twitter', label: 'X (Twitter)', icon: '🐦' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'facebook', label: 'Facebook', icon: '👥' }
  ];

  const togglePlatform = (platform: PlatformType) => {
    const currentPlatforms = draft.requirements?.platforms || [];
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];
    setDraft(d => ({ 
      ...d, 
      requirements: { 
        ...(d.requirements || { platforms: [] }), 
        platforms: newPlatforms as PlatformType[]
      } 
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
          <p className="mt-2 text-gray-600">Create compelling campaigns and connect with talented creators to bring your brand vision to life</p>
        </div>

        {/* Create Campaign Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PlusIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Launch Your Next Campaign</h2>
          </div>

          {user && (user.role as string) !== 'brand' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">
                    You are logged in as a <span className="font-medium">{user.role as string}</span>. Only brand users can create campaigns.
                  </p>
                </div>
          </div>
        </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div className="lg:col-span-2">
              <label htmlFor="campaign-title" className="block text-sm font-medium text-gray-700 mb-2">Campaign Title</label>
              <input 
                id="campaign-title"
                className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors " 
                placeholder="e.g., Summer Fashion Collection 2024 "  
                value={draft.title || ''} 
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} 
              />
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="campaign-budget" className="block text-sm font-medium text-gray-700 mb-2">Budget (INR)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input 
                  id="campaign-budget"
                  className="w-full text-black pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  type="number" 
                  placeholder="50,000" 
                  value={draft.budget || ''} 
                  onChange={e => setDraft(d => ({ ...d, budget: Number(e.target.value) }))} 
                />
        </div>
      </div>

            {/* Deadline */}
              <div>
              <label htmlFor="campaign-deadline" className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
              <div className="flex gap-3">
                <input 
                  id="campaign-deadline"
                  className="flex-1 px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  type="date" 
                  value={deadlineDate} 
                  onChange={e => setDeadlineDate(e.target.value)} 
                />
                <input 
                  id="campaign-time"
                  className="w-32 px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  type="time" 
                  value={deadlineTime} 
                  onChange={e => setDeadlineTime(e.target.value)} 
                />
              </div>
            </div>

            {/* Platform Selection */}
            <div className="lg:col-span-2">
              <label htmlFor="platform-selector" className="block text-sm font-medium text-gray-700 mb-2">Social Media Platforms</label>
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left flex items-center justify-between"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="text-gray-700">
                    {(draft.requirements?.platforms?.length || 0) > 0 
                      ? `${draft.requirements?.platforms?.length || 0} platform(s) selected`
                      : 'Choose your target social media platforms'
                    }
                  </span>
                  <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-2">
                      {platformOptions.map((option) => (
                        <label key={option.value} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.requirements?.platforms?.includes(option.value as PlatformType) || false}
                            onChange={() => togglePlatform(option.value as PlatformType)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700 flex items-center gap-2">
                            <span>{option.icon}</span>
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected platforms display */}
              {draft.requirements?.platforms && draft.requirements.platforms.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {draft.requirements.platforms.map(platform => {
                    const option = platformOptions.find(opt => opt.value === platform);
                    return (
                      <span key={platform} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        <span>{option?.icon}</span>
                        {option?.label}
                        <button
                          onClick={() => togglePlatform(platform as PlatformType)}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                id="campaign-description"
                className="w-full px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none" 
                rows={4}
                placeholder="Describe your campaign goals, target audience, content requirements, and any specific deliverables you expect from creators..." 
                value={draft.description || ''} 
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} 
              />
            </div>

            {/* Publish Option */}
            <div className="lg:col-span-2">
              <label htmlFor="publish-option" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
                <span className="sr-only">Publish immediately option</span>
                <input 
                  id="publish-option"
                  type="checkbox" 
                  checked={publishActive} 
                  onChange={e => setPublishActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Publish immediately</span>
                  <p className="text-xs text-gray-500">Make your campaign live and visible to creators right away</p>
                </div>
              </label>
            </div>
          </div>

          {/* Error Messages */}
          {formError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {!isValid && invalidReasons.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Please fix the following issues:</h3>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    {invalidReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
              disabled={creating || !isValid} 
              onClick={onCreate}
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Campaign...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Create Campaign
                </>
              )}
            </button>
          </div>
      </div>

        {/* Campaigns List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Campaigns</h2>
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">Loading your campaigns...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && campaigns.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start building your brand presence by creating your first campaign above.</p>
            </div>
          )}

          {!loading && !error && campaigns.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {campaigns.map(c => (
                <div key={c._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{c.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">{c.description}</p>
                    </div>
                    <div className="ml-4">
                      {(() => {
                        const statusConfig = {
                          active: { bg: 'bg-green-100', text: 'text-green-800' },
                          draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
                          completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
                          default: { bg: 'bg-yellow-100', text: 'text-yellow-800' }
                        };
                        const config = statusConfig[c.status as keyof typeof statusConfig] || statusConfig.default;
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                            {c.status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>Platforms</span>
                      <span>Budget</span>
                    </div>
                  <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {c.requirements.platforms.map(p => {
                          const option = platformOptions.find(opt => opt.value === p);
                          return (
                            <span key={p} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                              <span>{option?.icon}</span>
                              {option?.label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">₹{c.budget.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button 
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCampaignId === c._id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`} 
                      onClick={() => setSelectedCampaignId(prev => prev === c._id ? null : c._id)}
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Proposals
                    </button>
                    <div className="text-xs text-gray-500">
                      {new Date(c.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bids Modal */}
      {!!selectedCampaignId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Campaign Proposals</h2>
                <p className="text-sm text-gray-600 mt-1">Review creative proposals and select the best fit for your campaign</p>
              </div>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setSelectedCampaignId(null)}
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {bidsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">Loading proposals...</span>
                  </div>
                </div>
              )}
              
              {bidsError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{bidsError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!bidsLoading && !bidsError && bids.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Creative proposals will appear here once creators start applying to your campaign.</p>
                </div>
              )}
              
              {!bidsLoading && !bidsError && bids.length > 0 && (
                <div className="space-y-4">
                  {bids.map(b => (
                    <div key={b._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl font-bold text-gray-900">
                              ₹{b.bid_amount.toLocaleString()}
                            </div>
                            <span className="text-sm text-gray-500">{b.currency}</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New Proposal
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {b.proposal_text}
                          </div>

                          {/* Creator Social Profiles for campaign-selected platforms */}
                          {typeof (b as any).creator_id === 'object' && (b as any).creator_id?.socialAccounts && (
                            <div className="mt-4">
                              <div className="text-xs text-gray-500 mb-1">Creator Profiles</div>
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const sa = (b as any).creator_id.socialAccounts as Record<string, any>;
                                  const selectedPlatforms = Array.isArray((b as any).campaign_id?.requirements?.platforms)
                                    ? (b as any).campaign_id.requirements.platforms as string[]
                                    : [];
                                  const items: Array<{ label: string; url?: string; handle?: string }> = [];
                                  const pushIfSelected = (platform: string, label: string) => {
                                    if (!selectedPlatforms.includes(platform)) return;
                                    items.push({ label });
                                  };
                                  if (sa.instagram?.username) pushIfSelected('instagram', `Instagram: @${sa.instagram.username}`);
                                  if (sa.twitter?.username) pushIfSelected('twitter', `X: @${sa.twitter.username}`);
                                  if (sa.youtube?.customUrl || sa.youtube?.title) pushIfSelected('youtube', `YouTube: ${sa.youtube.customUrl || sa.youtube.title}`);
                                  if (sa.linkedin?.username || sa.linkedin?.name) pushIfSelected('linkedin', `LinkedIn: ${sa.linkedin.username || sa.linkedin.name}`);
                                  if (sa.facebook?.username || sa.facebook?.name) pushIfSelected('facebook', `Facebook: ${sa.facebook.username || sa.facebook.name}`);
                                  return items.length
                                    ? items.map((it, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-700">
                                          {it.label}
                                        </span>
                                      ))
                                    : null;
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="ml-6 flex flex-col gap-2">
                          <button 
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                            onClick={() => onAccept(selectedCampaignId, b._id)}
                          >
                            <CheckIcon className="h-4 w-4" />
                            Accept
                          </button>
                          <button 
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            onClick={() => onReject(selectedCampaignId, b._id)}
                          >
                            <XMarkIcon className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


