import React from 'react';

const ModeSwitcher = ({ activeMode, setActiveMode }) => {
  return (
    <div className="flex justify-center mb-6 px-4">
      <div className="bg-slate-100 rounded-full p-1 flex shadow-sm border border-slate-200">
        <button
          onClick={() => setActiveMode('free')}
          className={`flex-1 px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeMode === 'free'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Free Laundry
        </button>
        <button
          onClick={() => setActiveMode('paid')}
          className={`flex-1 px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeMode === 'paid'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Paid Laundry
        </button>
      </div>
    </div>
  );
};

export default ModeSwitcher;
