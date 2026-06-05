import React from "react";
import { Card } from "@components/Common/Card";

export const KpiCard = ({ title, value, subtext, trend, trendType }) => {
  return (
    <Card>
      <p className="text-xs font-semibold text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{value}</h3>
      <div className="flex items-center gap-1.5">
        {trend && (
          <span className={"text-xs font-bold " + (trendType === "up" ? "text-red-500" : trendType === "down" ? "text-blue-500" : "text-[#03a94d]")}>
            {trend}
          </span>
        )}
        <span className="text-[11px] text-gray-400 font-medium">{subtext}</span>
      </div>
    </Card>
  );
};
