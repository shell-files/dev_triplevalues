import React, { useState } from "react";
import SupplyChainMapList from "@admin/maps/SupplyChainMapList";
import SupplyChainMapDetail from "@admin/maps/SupplyChainMapDetail";
import SupplyChainMapRequest from "@admin/maps/SupplyChainMapRequest";
import SupplyChainMapMaterialRequest from "@admin/maps/SupplyChainMapMaterialRequest";

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

      case "request":
        return (
          <SupplyChainMapRequest
            onBack={() => setCurrentView("list")}
          />
        );

      case "materialRequest":
        return (
          <SupplyChainMapMaterialRequest
            onBack={() => setCurrentView("list")}
          />
        );

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
