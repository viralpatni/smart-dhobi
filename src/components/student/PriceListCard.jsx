import React, { useState } from 'react';
import { usePaidPricing } from '../../hooks/usePaidPricing';

const PriceListCard = () => {
  const [expanded, setExpanded] = useState(true);
  const { items, loading } = usePaidPricing();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
      </div>
    );
  }

  if (items.length === 0) return null;

  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🏷️</span>
          <h2 className="font-bold text-amber-900">Service Price List</h2>
        </div>
        <svg 
          className={`w-5 h-5 text-amber-600 transition-transform ${expanded ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-amber-100">
          {Object.keys(groupedItems).map((category, catIndex) => (
            <div key={category}>
              <div className="bg-white px-4 py-2 border-b border-amber-50">
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">{category}</h3>
              </div>
              <div>
                {groupedItems[category].map((item, i) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? 'bg-amber-50/30' : 'bg-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.iconEmoji && <span className="text-lg">{item.iconEmoji}</span>}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.itemName}</p>
                        {item.unit !== 'per piece' && <p className="text-[10px] text-slate-500">{item.unit}</p>}
                      </div>
                    </div>
                    <div className="font-bold text-amber-600">
                      ₹{item.pricePerPiece}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="bg-amber-50 p-3 text-center border-t border-amber-100">
            <p className="text-[10px] text-amber-700 font-medium">Prices are per piece unless noted. Payment collected on delivery.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceListCard;
