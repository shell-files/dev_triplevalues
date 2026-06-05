import React from "react";

export const Card = ({ children, className }) => {
  return (
    <div className={"bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition " + (className || "")}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => {
  return (
    <div className={"flex items-center justify-between mb-4 " + (className || "")}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className }) => {
  return (
    <h3 className={"text-sm font-bold text-gray-900 tracking-tight " + (className || "")}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className }) => {
  return (
    <div className={className || ""}>
      {children}
    </div>
  );
};
