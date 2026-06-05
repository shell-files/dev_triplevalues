import React from "react";

const CircleIcon = ({ className = "w-5 h-5", color = "#03a94d" }) => {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4Z" 
        fill={color} 
      />
    </svg>
  );
};

export default CircleIcon;
