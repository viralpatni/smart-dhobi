import React from 'react';

const Loader = ({ fullScreen = false }) => {
  const wrapperClass = fullScreen 
    ? "fixed inset-0 bg-white/80 flex items-center justify-center z-50 flex-col gap-3" 
    : "flex py-8 items-center justify-center flex-col gap-3 w-full";

  return (
    <div className={wrapperClass}>
      <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      <p className="text-teal-600 font-medium animate-pulse text-sm">Please wait...</p>
    </div>
  );
};

export default Loader;
