import React, { useState } from "react";
import SupplyChainMapList from "./SupplyChainMapList";

const SupplyChainMap = () => {
  const [currentView, setCurrentView] = useState("list");

  const renderView = () => {
    switch (currentView) {
      case "list":
        return (
          <SupplyChainMapList
            onViewDetail={() => setCurrentView("detail")}
            onViewMaterialRequest={() => setCurrentView("materialRequest")}
            onViewRequest={() => setCurrentView("request")}
          />
        );

      /*
      case "detail":
        // 추후 SupplyChainMapDetail 컴포넌트 마이그레이션 및 이관 렌더링 예정 구역
        return null;
      case "request":
        // 추후 긴급요청 화면 마이그레이션 및 이관 렌더링 예정 구역
        return null;
      case "materialRequest":
        // 추후 원자재 요청 화면 마이그레이션 및 이관 렌더링 예정 구역
        return null;
      */

      default:
        return (
          <SupplyChainMapList
            onViewDetail={() => setCurrentView("detail")}
            onViewMaterialRequest={() => setCurrentView("materialRequest")}
            onViewRequest={() => setCurrentView("request")}
          />
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {renderView()}
    </div>
  );
};

export default SupplyChainMap;
