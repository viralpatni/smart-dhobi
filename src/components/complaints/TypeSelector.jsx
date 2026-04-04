import React from 'react';

const TypeSelector = ({ selectedType, onSelect }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div 
        onClick={() => onSelect('complaint')}
        className={`flex-1 p-5 rounded-xl cursor-pointer border-2 transition-all ${
          selectedType === 'complaint' 
            ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100' 
            : 'bg-white border-slate-200 hover:border-red-200 hover:bg-slate-50'
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedType === 'complaint' ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h3 className={`font-bold text-lg mb-1 ${selectedType === 'complaint' ? 'text-red-900' : 'text-slate-800'}`}>File a Complaint</h3>
        <p className={`text-sm ${selectedType === 'complaint' ? 'text-red-700' : 'text-slate-500'}`}>Report a problem with service or staff conduct</p>
      </div>

      <div 
        onClick={() => onSelect('feedback')}
        className={`flex-1 p-5 rounded-xl cursor-pointer border-2 transition-all ${
          selectedType === 'feedback' 
            ? 'border-teal-400 bg-teal-50 shadow-sm shadow-teal-100' 
            : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-slate-50'
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedType === 'feedback' ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        </div>
        <h3 className={`font-bold text-lg mb-1 ${selectedType === 'feedback' ? 'text-teal-900' : 'text-slate-800'}`}>Give Feedback</h3>
        <p className={`text-sm ${selectedType === 'feedback' ? 'text-teal-700' : 'text-slate-500'}`}>Share suggestions, appreciation, or ideas</p>
      </div>
    </div>
  );
};

export default TypeSelector;
