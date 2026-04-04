import React, { useState } from 'react';

const StarRating = ({ rating, onChange, readOnly = false, size = "large" }) => {
  const [hover, setHover] = useState(0);

  const starSize = size === "large" ? "w-8 h-8" : "w-5 h-5";
  const containerClass = size === "large" ? "flex gap-2" : "flex gap-1";

  const labels = {
    1: "Very Unsatisfied",
    2: "Unsatisfied",
    3: "Neutral",
    4: "Satisfied",
    5: "Very Satisfied"
  };

  return (
    <div className="flex flex-col items-center sm:items-start">
      <div className={containerClass}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110 active:scale-95"} focus:outline-none`}
          >
            <svg
              className={`${starSize} ${
                star <= (hover || rating) ? 'text-amber-400' : 'text-slate-300'
              } transition-colors`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {!readOnly && size === "large" && rating > 0 && (
        <span className="text-sm font-bold text-amber-600 mt-2">
          {labels[rating]}
        </span>
      )}
    </div>
  );
};

export default StarRating;
