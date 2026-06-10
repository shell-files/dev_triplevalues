import React, { useState } from "react";
import SupplyChainMapList from "./SupplyChainMapList";
import SupplyChainMapDetail from "./SupplyChainMapDetail";

const SupplyChainMap = () => {
  const [currentView, setCurrentView] = useState("list");
  const [selectedProductId, setSelectedProductId] = useState(null);

  const renderView = () => {
    switch (currentView) {
      case "list":
        return (
          <SupplyChainMapList
            onViewDetail={(id) => {
              setSelectedProductId(id);
              setCurrentView("detail");
            }}
            onViewMaterialRequest={() => setCurrentView("materialRequest")}
            onViewRequest={() => setCurrentView("request")}
          />
        );

      case "detail":
        return (
          <SupplyChainMapDetail
            productId={selectedProductId}
            onBack={() => setCurrentView("list")}
          />
        );

      /*
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
            onViewDetail={(id) => {
              setSelectedProductId(id);
              setCurrentView("detail");
            }}
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
