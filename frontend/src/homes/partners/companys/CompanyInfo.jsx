import React, { useState, useEffect } from "react";
import CompanyWelcome from "@partners/companys/CompanyWelcome";
import CompanyForm from "@partners/companys/CompanyForm";
import CompanyDetail from "@partners/companys/CompanyDetail";
import { GET } from "@utils/Network";

/* [v3.0] CompanyInfos.jsx 전 기능 이식 — is_registered 라우팅, API 연동, 파일/공장 상태 */

const CompanyInfo = ({ loginData }) => {
  const [viewState, setViewState] = useState("loading");
  const [apiCompany, setApiCompany] = useState(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [factories, setFactories] = useState([]);
  const [categorizedFiles, setCategorizedFiles] = useState({ coc: [], selfassess: [], evidence: [], cert: [] });

  const [formData, setFormData] = useState({
    companyName: "", ceoName: "", bizNo: "", foundedDate: "", address: "",
    companySize: "", country: "", scope1: "", scope2: "", feocRatio: "", trir: "",
  });
  const [certs, setCerts] = useState({
    iso14001: "", iso45001: "", iatf16949: "", rba: "", rmap: "", cmrt: "", emat: "",
  });

  /* 파일 상태 — 파일명 표시 + File 객체 보존 (업로드용) */
  const [cocFileName, setCocFileName] = useState("");
  const [selfAssessFileName, setSelfAssessFileName] = useState("");
  const [certFileNames, setCertFileNames] = useState([]);
  const [evidenceFileNames, setEvidenceFileNames] = useState([]);
  const [cocFileObj, setCocFileObj] = useState(null);
  const [selfAssessFileObj, setSelfAssessFileObj] = useState(null);
  const [certFileObjs, setCertFileObjs] = useState([]);
  const [evidenceFileObjs, setEvidenceFileObjs] = useState([]);

  const pid = loginData?.partner_id;

  /* 마운트 시 API 조회 → is_registered 기반 viewState 분기 */
  useEffect(() => {
    if (!pid) { setViewState("welcome"); return; }

    GET(`/company/${pid}`).then(json => {
      if (json.status && json.data) {
        const c = json.data.company || json.data;
        setApiCompany(c);

        /* [v3.0] 9개 필수 필드 검증 — 하나라도 누락 시 welcome */
        const requiredFields = ["biz_no", "founded", "address", "size", "country", "scope1", "scope2", "feoc_ratio", "trir"];
        const incomplete = requiredFields.some(f => !c[f] && c[f] !== 0);
        
        setIsProfileIncomplete(incomplete);

        /* 폼 데이터 바인딩 (신규 기업도 company_name/ceo_name 기본값 표시) */
        setFormData({
          companyName: c.company_name || "", ceoName: c.ceo_name || "",
          bizNo: c.biz_no || "", foundedDate: c.founded || "",
          address: c.address || "", companySize: c.size || "",
          country: c.country || "", scope1: c.scope1 ?? "",
          scope2: c.scope2 ?? "", feocRatio: c.feoc_ratio ?? "",
          trir: c.trir ?? "",
        });
        setCerts({
          iso14001: c.iso14001 || "", iso45001: c.iso45001 || "",
          iatf16949: c.iatf || "", rba: c.rba || "",
          rmap: c.rmap || "", cmrt: c.cmrt || "", emat: c.emat || "",
        });

        /* 화면 분기: 미등록(incomplete) → welcome, 등록완료 → detail */
        setViewState(incomplete ? "welcome" : "detail");

        /* 공장 + 파일 조회 */
        setFactories(json.data.factories || []);
      } else {
        setViewState("welcome");
      }
    }).catch(() => setViewState("welcome"));

    /* 파일 목록 조회 */
    GET(`/company/${pid}/files`).then(fj => {
      if (fj.status && fj.data) {
        setCocFileName(fj.data.coc[0]?.origin || "");
        setSelfAssessFileName(fj.data.selfassess[0]?.origin || "");
        setCertFileNames(fj.data.cert.map(f => f.origin));
        setEvidenceFileNames(fj.data.evidence.map(f => f.origin));
        setCategorizedFiles(fj.data);
      }
    }).catch(() => {});
  }, [pid]);

  /* 등록/수정 완료 후 → detail로 전환 + 데이터 갱신 */
  const handleSaveComplete = (updatedCompany) => {
    setApiCompany(updatedCompany);
    setIsProfileIncomplete(false);
    setViewState("detail");
    /* 파일 재조회 */
    if (pid) {
      GET(`/company/${pid}/files`).then(fj => {
        if (fj.status && fj.data) setCategorizedFiles(fj.data);
      });
    }
  };

  const handleCancel = () => { setViewState(apiCompany && !isProfileIncomplete ? "detail" : "welcome"); };
  const handleAddFactory = (f) => { setFactories(prev => [...prev, f]); };
  const handleDeleteFactory = (id) => { setFactories(prev => prev.filter(f => f.id !== id)); };
  const handleUpdateFactory = (uf) => { setFactories(prev => prev.map(f => f.id === uf.id ? uf : f)); };

  const fileStates = {
    cocFileName, setCocFileName, selfAssessFileName, setSelfAssessFileName,
    certFileNames, setCertFileNames, evidenceFileNames, setEvidenceFileNames,
    cocFileObj, setCocFileObj, selfAssessFileObj, setSelfAssessFileObj,
    certFileObjs, setCertFileObjs, evidenceFileObjs, setEvidenceFileObjs,
    categorizedFiles, setCategorizedFiles,
  };

  if (viewState === "loading") return (
    <div className="p-6 flex items-center justify-center text-gray-400 min-h-[300px]">데이터를 불러오는 중입니다...</div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in w-full min-h-[calc(100vh-140px)] flex flex-col font-['Pretendard'] text-gray-700">
      {viewState === "welcome" && (
        <CompanyWelcome onNavigateToRegister={() => setViewState("register")} />
      )}
      {viewState === "register" && (
        <CompanyForm
          formData={formData} setFormData={setFormData}
          certs={certs} setCerts={setCerts}
          fileStates={fileStates}
          onSaveComplete={handleSaveComplete}
          onCancel={handleCancel}
          loginData={loginData}
          apiCompany={apiCompany}
          isProfileIncomplete={isProfileIncomplete}
        />
      )}
      {viewState === "detail" && (
        <CompanyDetail
          savedData={{ formData, certs, cocFileName, selfAssessFileName, certFileNames, evidenceFileNames}}
          apiCompany={apiCompany}
          factories={factories}
          categorizedFiles={categorizedFiles}
          onAddFactory={handleAddFactory}
          onDeleteFactory={handleDeleteFactory}
          onUpdateFactory={handleUpdateFactory}
          onNavigateToRegister={() => setViewState("register")}
          loginData={loginData}
        />
      )}
    </div>
  );
};

export default CompanyInfo;
