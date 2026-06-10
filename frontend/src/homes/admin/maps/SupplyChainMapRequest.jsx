import React from "react";
import RequestFormBase from "@components/UI/RequestFormBase";

const SupplyChainMapRequest = ({ onBack }) => {
  return (
    <RequestFormBase
      title="긴급요청"
      subTitle="선택된 발주 정보 및 제품 규격에 대한 긴급 ESG 원자재 정보 요청을 발송합니다."
      helperTextNew="* 신규 등록의 경우 요청 항목 선택이 불가합니다."
      helperTextReview="* 긴급 규제 실사를 위해 협력사에 요청할 세부 규격 제원 항목을 선택하세요."
      submitMessage="긴급 요청이 성공적으로 전송되었습니다."
      onBack={onBack}
    />
  );
};

export default SupplyChainMapRequest;
