import React from "react";

const Auth = ({ className = "w-6 h-6", color = "#03a94d" }) => {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 14.94a6.44 6.44 0 1 0 0-12.88 6.44 6.44 0 0 0 0 12.88Zm.055 1.475A7.87 7.87 0 0 1 7.56 15.01v5.805c0 .44.24.84.63 1.05.39.21.855.185 1.22-.06L12 20.08l2.59 1.725c.2.135.43.2.66.2a1.189 1.189 0 0 0 1.19-1.19v-5.73a7.897 7.897 0 0 1-4.385 1.325v.005Z" 
        fill={color} 
      />
    </svg>
  );
};

export default Auth;
