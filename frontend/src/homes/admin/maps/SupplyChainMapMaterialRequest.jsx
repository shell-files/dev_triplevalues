import React from "react";
import RequestFormBase from "@components/UI/RequestFormBase";

const SupplyChainMapMaterialRequest = ({ onBack }) => {
  return (
    <RequestFormBase
      title="원자재 요청"
      subTitle="선택된 제품에 대한 원자재 사양 검토 및 제출 요청을 발송합니다."
      helperTextNew="* 신규 등록의 경우 요청 항목 선택이 불가합니다."
      helperTextReview="* 원자재 정보 검토 요청을 위해 협력사에 요청할 세부 규격 제원 항목을 선택하세요."
      submitMessage="원자재 요청이 성공적으로 전송되었습니다."
      onBack={onBack}
    />
  );
};

export default SupplyChainMapMaterialRequest;
