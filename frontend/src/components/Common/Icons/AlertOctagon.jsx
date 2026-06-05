import React from "react";

const AlertOctagon = ({ className = "w-5 h-5", color = "#ef4444" }) => {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M16.14 2H7.86L2 7.86v8.285l5.86 5.86h8.285l5.86-5.86V7.86L16.145 2h-.005Zm-4.89 5.5h1.5v6h-1.5v-6ZM12 17c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1Z" 
        fill={color} 
      />
    </svg>
  );
};

export default AlertOctagon;
