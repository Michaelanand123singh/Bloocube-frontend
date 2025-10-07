"use client";
import { useEffect, useMemo, useState } from "react";
import { useBids } from "@/hooks/useBids";
import type { Bid } from "@/types/bid";
import { authUtils } from "@/lib/auth";
import CreatorLayout from "@/Components/Creater/CreatorLayout";
import { IndianRupee, Circle } from "lucide-react";

export default function CreatorBidsPage() {
  const { data: bids, loading, error, refetch, setParams } = useBids({ limit: 20 });
  const [formError, setFormError] = useState<string | null>(null);

  const userId = useMemo(() => authUtils.getUser?.()?._id || null, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Creators place bids from the Marketplace or campaign detail pages.

  return (
    <CreatorLayout title="My Bids" subtitle="Manage and track your bids">
      <div className="p-6 space-y-6">
        {/* Info Banner: where to bid */}
        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-100 rounded-2xl p-4 text-sm text-gray-700">
          Creators can place bids from the Marketplace or a campaign’s detail page. This view shows your submitted bids.
        </div>

        {/* Bids List */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">My Bids</h2>
              {loading && <span className="text-xs text-gray-500">Loading...</span>}
            </div>
            <div>
              <button
                onClick={() => refetch()}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bids.map((b: Bid) => (
              <div key={b._id} className="bg-white rounded-xl border border-gray-200/70 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">Campaign</div>
                    <div className="font-semibold text-gray-900 truncate">
                      {typeof b.campaign_id === "object" && (b.campaign_id as any)?.title
                        ? (b.campaign_id as any).title
                        : 'Campaign'}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      b.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                      b.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      b.status === 'withdrawn' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                      b.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-700 line-clamp-3">{b.proposal_text}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-700">
                    <IndianRupee className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{b.bid_amount}</span>
                    <span className="text-gray-500">{b.currency}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Circle className="w-3 h-3 fill-current opacity-60" />
                    <span>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && bids.length === 0 && (
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-purple-50/60 border border-blue-100 rounded-xl p-4 mt-2">
              <div>
                <p className="text-sm text-gray-700 font-medium">No bids yet</p>
                <p className="text-xs text-gray-500">Browse Marketplace campaigns and place your first bid.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
}


