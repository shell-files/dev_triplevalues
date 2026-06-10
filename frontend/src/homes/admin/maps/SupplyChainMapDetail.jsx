import React, { useState, useEffect } from "react";

const PRODUCT_DATA_MAP = {
  'PRD-001': {
    name: '열차폐판',
    poNumber: 'PO-2026-0049',
    requests: [
      { id: 1, item: "원산지, 구성요소", partner: "노벨리스 코리아", material: "알루미늄 코일", date: "2026-06-02", status: "checking", statusLabel: "협력사 확인중" },
      { id: 2, item: "폭(mm), 길이(mm), 중량(kg)", partner: "케이알엠(주)", material: "P1020 잉곳", date: "2026-06-03", status: "completed", statusLabel: "회신 완료 (검증중)" }
    ],
    versions: {
      'v2.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV01',
          part: 'Al 3003-H14 판재',
          weight: '1,250 kg',
          qty: '1.02 pcs/pcs',
          leadtime: '5일',
          spec: '알루미늄 코일',
          origin: '대한민국 / 호주',
          dim: '폭 400mm, 길이 300mm, 두께 1.5mm',
          chem: { mn: '1.25', cu: '0.15', si: '0.60', fe: '0.70', al: '97.30' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR02',
          part: 'P1020 재생 잉곳',
          weight: '1,120 kg',
          qty: '1.00 pcs/pcs',
          leadtime: '3일',
          spec: '알루미늄 잉곳 99.7%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.05', cu: '0.01', si: '0.10', fe: '0.15', al: '99.69' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM03',
          part: 'Mn 정광 분말',
          weight: '0.062 kg',
          qty: '0.06 pcs/pcs',
          leadtime: '14일',
          spec: '망간 원광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.1-5.0mm 파쇄 형태',
          chem: { mn: '48.50', cu: '0.05', si: '6.20', fe: '4.80', al: '3.50' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT04',
          part: '보크사이트 원광',
          weight: '0.950 kg',
          qty: '0.92 pcs/pcs',
          leadtime: '20일',
          spec: 'Al2O3 보크사이트 광석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.10', cu: '0.02', si: '4.50', fe: '12.50', al: '55.20' }
        }
      },
      'v1.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV00',
          part: 'Al 3003-H14 판재',
          weight: '1,300 kg',
          qty: '1.05 pcs/pcs',
          leadtime: '7일',
          spec: '알루미늄 슬랩',
          origin: '대한민국 / 인도네시아',
          dim: '폭 380mm, 길이 280mm, 두께 1.5mm',
          chem: { mn: '1.10', cu: '0.20', si: '0.70', fe: '0.85', al: '97.15' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR01',
          part: 'P1020 잉곳',
          weight: '1,150 kg',
          qty: '1.02 pcs/pcs',
          leadtime: '4일',
          spec: '알루미늄 잉곳 99.5%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.06', cu: '0.02', si: '0.12', fe: '0.20', al: '99.60' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM02',
          part: 'Mn 정광 분말',
          weight: '0.065 kg',
          qty: '0.07 pcs/pcs',
          leadtime: '15일',
          spec: '망간 광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.5-8.0mm 파쇄 형태',
          chem: { mn: '46.20', cu: '0.06', si: '7.10', fe: '5.20', al: '4.10' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT03',
          part: '보크사이트 원광',
          weight: '0.980 kg',
          qty: '0.95 pcs/pcs',
          leadtime: '22일',
          spec: '보크사이트 벌크 원석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.12', cu: '0.03', si: '5.10', fe: '13.80', al: '53.50' }
        }
      }
    }
  },
  'PRD-002': {
    name: '휠',
    poNumber: 'PO-2026-0050',
    requests: [
      { id: 1, item: "원산지, 구성요소", partner: "노벨리스 코리아", material: "알루미늄 플레이트", date: "2026-06-02", status: "checking", statusLabel: "협력사 확인중" },
      { id: 2, item: "폭(mm), 길이(mm), 중량(kg)", partner: "케이알엠(주)", material: "P1020 재생 잉곳", date: "2026-06-03", status: "completed", statusLabel: "회신 완료 (검증중)" }
    ],
    versions: {
      'v2.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV21',
          part: 'Al 3003-H16 판재',
          weight: '2,800 kg',
          qty: '1.01 pcs/pcs',
          leadtime: '6일',
          spec: '알루미늄 플레이트',
          origin: '대한민국 / 호주',
          dim: '폭 500mm, 길이 500mm, 두께 3.0mm',
          chem: { mn: '1.20', cu: '0.18', si: '0.58', fe: '0.72', al: '97.32' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR22',
          part: 'P1020 재생 잉곳 99.7%',
          weight: '2,500 kg',
          qty: '1.00 pcs/pcs',
          leadtime: '3일',
          spec: '알루미늄 잉곳 99.7%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.05', cu: '0.01', si: '0.10', fe: '0.15', al: '99.69' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM03',
          part: 'Mn 정광 분말',
          weight: '0.120 kg',
          qty: '0.10 pcs/pcs',
          leadtime: '14일',
          spec: '망간 원광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.1-5.0mm 파쇄 형태',
          chem: { mn: '48.50', cu: '0.05', si: '6.20', fe: '4.80', al: '3.50' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT04',
          part: '보크사이트 원광',
          weight: '1.800 kg',
          qty: '1.75 pcs/pcs',
          leadtime: '20일',
          spec: 'Al2O3 보크사이트 광석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.10', cu: '0.02', si: '4.50', fe: '12.50', al: '55.20' }
        }
      },
      'v1.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV20',
          part: 'Al 3003-H16 판재',
          weight: '2,900 kg',
          qty: '1.03 pcs/pcs',
          leadtime: '8일',
          spec: '알루미늄 플레이트',
          origin: '대한민국 / 인도네시아',
          dim: '폭 500mm, 길이 500mm, 두께 3.0mm',
          chem: { mn: '1.15', cu: '0.22', si: '0.62', fe: '0.78', al: '97.23' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR21',
          part: 'P1020 잉곳',
          weight: '2,600 kg',
          qty: '1.02 pcs/pcs',
          leadtime: '4일',
          spec: '알루미늄 잉곳 99.5%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.06', cu: '0.02', si: '0.12', fe: '0.20', al: '99.60' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM02',
          part: 'Mn 정광 분말',
          weight: '0.130 kg',
          qty: '0.11 pcs/pcs',
          leadtime: '15일',
          spec: '망간 광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.5-8.0mm 파쇄 형태',
          chem: { mn: '46.20', cu: '0.06', si: '7.10', fe: '5.20', al: '4.10' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT03',
          part: '보크사이트 원광',
          weight: '1.900 kg',
          qty: '1.80 pcs/pcs',
          leadtime: '22일',
          spec: '보크사이트 벌크 원석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.12', cu: '0.03', si: '5.10', fe: '13.80', al: '53.50' }
        }
      }
    }
  },
  'PRD-003': {
    name: '파이프',
    poNumber: 'PO-2026-0051',
    requests: [
      { id: 1, item: "원산지, 구성요소", partner: "노벨리스 코리아", material: "알루미늄 튜브", date: "2026-06-02", status: "checking", statusLabel: "협력사 확인중" },
      { id: 2, item: "폭(mm), 길이(mm), 중량(kg)", partner: "케이알엠(주)", material: "P1020 재생 잉곳", date: "2026-06-03", status: "completed", statusLabel: "회신 완료 (검증중)" }
    ],
    versions: {
      'v2.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV31',
          part: 'Al 3003-O 튜브',
          weight: '0.350 kg',
          qty: '1.02 pcs/pcs',
          leadtime: '4일',
          spec: '알루미늄 튜브',
          origin: '대한민국 / 호주',
          dim: '외경 12mm, 두께 1.5mm, 길이 3000mm',
          chem: { mn: '1.28', cu: '0.14', si: '0.62', fe: '0.68', al: '97.28' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR32',
          part: 'P1020 재생 잉곳 99.7%',
          weight: '0.310 kg',
          qty: '1.00 pcs/pcs',
          leadtime: '3일',
          spec: '알루미늄 잉곳 99.7%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.05', cu: '0.01', si: '0.10', fe: '0.15', al: '99.69' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM03',
          part: 'Mn 정광 분말',
          weight: '0.015 kg',
          qty: '0.01 pcs/pcs',
          leadtime: '14일',
          spec: '망간 원광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.1-5.0mm 파쇄 형태',
          chem: { mn: '48.50', cu: '0.05', si: '6.20', fe: '4.80', al: '3.50' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT04',
          part: '보크사이트 원광',
          weight: '0.220 kg',
          qty: '0.20 pcs/pcs',
          leadtime: '20일',
          spec: 'Al2O3 보크사이트 광석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.10', cu: '0.02', si: '4.50', fe: '12.50', al: '55.20' }
        }
      },
      'v1.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV30',
          part: 'Al 3003-O 튜브',
          weight: '0.360 kg',
          qty: '1.05 pcs/pcs',
          leadtime: '5일',
          spec: '알루미늄 튜브',
          origin: '대한민국 / 인도네시아',
          dim: '외경 12mm, 두께 1.5mm, 길이 3000mm',
          chem: { mn: '1.18', cu: '0.18', si: '0.68', fe: '0.80', al: '97.16' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR31',
          part: 'P1020 잉곳',
          weight: '0.320 kg',
          qty: '1.02 pcs/pcs',
          leadtime: '4일',
          spec: '알루미늄 잉곳 99.5%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.06', cu: '0.02', si: '0.12', fe: '0.20', al: '99.60' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM02',
          part: 'Mn 정광 분말',
          weight: '0.016 kg',
          qty: '0.02 pcs/pcs',
          leadtime: '15일',
          spec: '망간 광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.5-8.0mm 파쇄 형태',
          chem: { mn: '46.20', cu: '0.06', si: '7.10', fe: '5.20', al: '4.10' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT03',
          part: '보크사이트 원광',
          weight: '0.230 kg',
          qty: '0.21 pcs/pcs',
          leadtime: '22일',
          spec: '보크사이트 벌크 원석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.12', cu: '0.03', si: '5.10', fe: '13.80', al: '53.50' }
        }
      }
    }
  },
  'PRD-004': {
    name: '튜브',
    poNumber: 'PO-2026-0052',
    requests: [
      { id: 1, item: "원산지, 구성요소", partner: "노벨리스 코리아", material: "알루미늄 튜브", date: "2026-06-02", status: "checking", statusLabel: "협력사 확인중" },
      { id: 2, item: "폭(mm), 길이(mm), 중량(kg)", partner: "케이알엠(주)", material: "P1020 재생 잉곳", date: "2026-06-03", status: "completed", statusLabel: "회신 완료 (검증중)" }
    ],
    versions: {
      'v2.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV41',
          part: 'Al 3003-H14 튜브',
          weight: '0.150 kg',
          qty: '1.02 pcs/pcs',
          leadtime: '4일',
          spec: '알루미늄 튜브',
          origin: '대한민국 / 호주',
          dim: '외경 8mm, 두께 1.0mm, 길이 2000mm',
          chem: { mn: '1.22', cu: '0.16', si: '0.61', fe: '0.71', al: '97.30' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR42',
          part: 'P1020 재생 잉곳 99.7%',
          weight: '0.130 kg',
          qty: '1.00 pcs/pcs',
          leadtime: '3일',
          spec: '알루미늄 잉곳 99.7%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.05', cu: '0.01', si: '0.10', fe: '0.15', al: '99.69' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM03',
          part: 'Mn 정광 분말',
          weight: '0.008 kg',
          qty: '0.01 pcs/pcs',
          leadtime: '14일',
          spec: '망간 원광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.1-5.0mm 파쇄 형태',
          chem: { mn: '48.50', cu: '0.05', si: '6.20', fe: '4.80', al: '3.50' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT04',
          part: '보크사이트 원광',
          weight: '0.110 kg',
          qty: '0.10 pcs/pcs',
          leadtime: '20일',
          spec: 'Al2O3 보크사이트 광석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.10', cu: '0.02', si: '4.50', fe: '12.50', al: '55.20' }
        }
      },
      'v1.0': {
        novelis: {
          title: '노벨리스 코리아',
          partNo: 'PN-3003-NV40',
          part: 'Al 3003-H14 튜브',
          weight: '0.160 kg',
          qty: '1.05 pcs/pcs',
          leadtime: '5일',
          spec: '알루미늄 튜브',
          origin: '대한민국 / 인도네시아',
          dim: '외경 8mm, 두께 1.0mm, 길이 2000mm',
          chem: { mn: '1.15', cu: '0.21', si: '0.71', fe: '0.86', al: '97.07' }
        },
        krm: {
          title: '케이알엠(주)',
          partNo: 'PN-1020-KR41',
          part: 'P1020 잉곳',
          weight: '0.140 kg',
          qty: '1.02 pcs/pcs',
          leadtime: '4일',
          spec: '알루미늄 잉곳 99.5%',
          origin: '대한민국 / 러시아',
          dim: '가로 700mm, 세로 200mm, 높이 150mm',
          chem: { mn: '0.06', cu: '0.02', si: '0.12', fe: '0.20', al: '99.60' }
        },
        comilog: {
          title: 'Comilog 가봉 광산 자산',
          partNo: 'PN-5001-CM02',
          part: 'Mn 정광 분말',
          weight: '0.009 kg',
          qty: '0.02 pcs/pcs',
          leadtime: '15일',
          spec: '망간 광석',
          origin: '가봉 / 가봉',
          dim: '입도 0.5-8.0mm 파쇄 형태',
          chem: { mn: '46.20', cu: '0.06', si: '7.10', fe: '5.20', al: '4.10' }
        },
        riotinto: {
          title: 'Rio Tinto 보크사이트 인프라',
          partNo: 'PN-7002-RT03',
          part: '보크사이트 원광',
          weight: '0.120 kg',
          qty: '0.11 pcs/pcs',
          leadtime: '22일',
          spec: '보크사이트 벌크 원석',
          origin: '호주 / 호주',
          dim: '벌크 광석 형태',
          chem: { mn: '0.12', cu: '0.03', si: '5.10', fe: '13.80', al: '53.50' }
        }
      }
    }
  }
};

const SupplyChainMapDetail = ({ productId, onBack = () => {} }) => {
  const [selectedVersion, setSelectedVersion] = useState("v2.0");
  const [selectedNode, setSelectedNode] = useState("novelis");
  const [animate, setAnimate] = useState(false);

  // 대상 제품 데이터 룩업 (없을 경우 기본 열차폐판 매핑)
  const productData = PRODUCT_DATA_MAP[productId] || PRODUCT_DATA_MAP['PRD-001'];
  const versionData = productData.versions[selectedVersion] || productData.versions['v2.0'];
  const nodeDetail = versionData[selectedNode] || versionData['novelis'];

  // 버전 또는 노드 변경 시 차오르는 애니메이션 효과 발생
  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedVersion, selectedNode]);

  // 화학 성분 수치에 따른 고(Red), 중(Amber), 저(Green) 리스크 분류 로직
  const getRiskLevel = (name, valueStr) => {
    const val = parseFloat(valueStr);
    if (name === "al" || name === "Al") {
      if (val < 90) return "high";
      if (val < 98) return "medium";
      return "low";
    } else {
      if (val >= 10.0) return "high";
      if (val >= 1.0) return "medium";
      return "low";
    }
  };

  // 리스크 등급에 맞는 바 색상 매핑
  const getRiskColorClass = (riskLevel) => {
    if (riskLevel === "high") return "bg-red-500";
    if (riskLevel === "medium") return "bg-amber-500";
    return "bg-emerald-500";
  };

  // 화학 성분 너비 계산법 (정적 HTML 스펙과 동일)
  const getWidthPercent = (name, valStr) => {
    const val = parseFloat(valStr);
    if (name === "mn") return val;
    if (name === "cu") return val * 10;
    if (name === "si") return val * 10;
    if (name === "fe") return val * 5;
    if (name === "al") return val;
    return val;
  };

  const chemItems = [
    { key: "mn", label: "Mn (망간)", unitVal: `${nodeDetail.chem.mn}%`, rawVal: nodeDetail.chem.mn },
    { key: "cu", label: "Cu (구리)", unitVal: `${nodeDetail.chem.cu}%`, rawVal: nodeDetail.chem.cu },
    { key: "si", label: "Si (규소)", unitVal: `${nodeDetail.chem.si}%`, rawVal: nodeDetail.chem.si },
    { key: "fe", label: "Fe (철)", unitVal: `${nodeDetail.chem.fe}%`, rawVal: nodeDetail.chem.fe },
    { key: "al", label: "Al (알루미늄)", unitVal: `${nodeDetail.chem.al}%`, rawVal: nodeDetail.chem.al }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 w-full text-base">
      
      {/* 상단 정보 헤딩 및 목록 이동 인터페이스 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">공급망 맵 상세</h1>
        </div>

        <div>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-700 transition cursor-pointer"
          >
            &larr; 목록으로 돌아가기
          </button>
        </div>
      </div>

      {/* 제품 개요 및 버전 관리 인터페이스 (b-1 사양) */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full">
        {/* [좌측 정보 그룹] */}
        <div class="flex flex-wrap items-center gap-8 md:gap-16">
          {/* 블록 1 (대상 제품군) */}
          <div class="flex flex-col">
            <span class="text-sm text-gray-400 font-medium">대상 제품군</span>
            <span class="text-lg font-bold text-gray-900 mt-0.5">{productData.name}</span>
          </div>

          {/* 세로 구분선 */}
          <div class="w-px h-10 bg-gray-200 hidden sm:block"></div>

          {/* 블록 2 (버전 히스토리 선택) */}
          <div class="flex flex-col">
            <span class="text-sm text-gray-400 font-medium mb-1">버전 히스토리 선택</span>
            <select
              id="version-select"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="v2.0">v2.0 (2026-05-15 부터 2026-12-31) [최신]</option>
              <option value="v1.0">v1.0 (2025-01-01 부터 2026-05-14)</option>
            </select>
          </div>
        </div>

        {/* [우측 독립 블록] */}
        <div class="flex flex-col sm:items-end">
          <span class="text-sm text-gray-400 font-medium mb-1">BOM 검증 상태</span>
          <div id="bom-status-badge-container">
            {selectedVersion === "v2.0" ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                활성
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                비활성
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2분할 레이아웃 (좌측 8 / 우측 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* 좌측 영역 (8열) */}
        <div className="lg:col-span-8 flex flex-col space-y-5">

          {/* 공급망 정보 요청 및 응답 진행 현황 원장 테이블 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm md:text-base font-bold text-gray-700">공급망 정보 요청 및 응답 진행 현황 ({productData.poNumber})</h3>
              <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded animate-pulse">긴급조사 진행중</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-gray-700 table-fixed">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/30 text-gray-500 font-bold">
                    <th className="px-4 py-3 w-[32%]">요청 분류 항목</th>
                    <th className="px-4 py-3 w-[17%]">대상 공급 협력사</th>
                    <th className="px-4 py-3 w-[17%]">연결 투입 자재명</th>
                    <th className="px-4 py-3 w-[17%]">요청 및 발송일자</th>
                    <th className="px-4 py-3 w-[17%]">현재 진척 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {productData.requests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 font-medium text-gray-900 truncate">{req.item}</td>
                      <td className="px-4 py-3 font-semibold truncate">{req.partner}</td>
                      <td className="px-4 py-3 truncate">{req.material}</td>
                      <td className="px-4 py-3 font-mono">{req.date}</td>
                      <td className="px-4 py-3">
                        {req.status === "checking" ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                            {req.statusLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">
                            {req.statusLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 공급망 맵 다단계 계층 트리 전개 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 flex-1 flex flex-col">
            <div>
              <h3 className="text-sm md:text-base font-bold text-gray-700">공급망 맵</h3>
              <p className="text-xs text-gray-400 mt-1">* 협력사를 클릭하시면 해당 협력사의 BOM 및 원자재 정보가 우측 패널에 표시됩니다.</p>
            </div>

            {/* 가로/세로 트리 시각화 패널 */}
            <div className="relative py-4 px-2 bg-slate-50/50 rounded-xl border border-gray-200/50 flex-1 min-h-[460px] overflow-x-auto">
              <div className="relative w-[600px] h-[440px] mx-auto">
                {/* SVG 곡선/실선 연결선 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {/* 1차 -> 2차 실선 */}
                  <line x1="300" y1="116" x2="300" y2="178" stroke="#cbd5e1" strokeWidth="2" />
                  {/* 2차 -> 3차-A (Comilog) 곡선 */}
                  <path d="M 300 284 C 300 310, 160 310, 160 338" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                  {/* 2차 -> 3차-B (Rio Tinto) 곡선 */}
                  <path d="M 300 284 C 300 310, 440 310, 440 338" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                </svg>

                {/* 1차 협력사 레벨 (저위험: 초록 테마) */}
                <button
                  type="button"
                  id="node-novelis"
                  onClick={() => setSelectedNode('novelis')}
                  className={`absolute left-1/2 -translate-x-1/2 top-3 w-60 bg-emerald-50/40 border-2 border-emerald-500 shadow-md rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'novelis' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded">1차 가공</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold">저위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">노벨리스 코리아</p>
                  <p className="text-sm text-emerald-800 mt-1 font-semibold">압연 및 합금 가공 플레이트</p>
                </button>

                {/* 2차 제련소 레벨 (중위험: 노란 테마) */}
                <button
                  type="button"
                  id="node-krm"
                  onClick={() => setSelectedNode('krm')}
                  className={`absolute left-1/2 -translate-x-1/2 top-[180px] w-60 bg-amber-50/40 border-2 border-amber-400 shadow-sm rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'krm' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded">2차 제련</span>
                    <span className="text-xs font-mono text-amber-700 font-bold">중위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">케이알엠(주)</p>
                  <p className="text-sm text-amber-800 mt-1 font-semibold">재생 알루미늄 용해/제련</p>
                </button>

                {/* 3차 채굴사 레벨 (2개 노드) */}
                {/* Comilog 가봉 (중위험: 노란 테마) */}
                <button
                  type="button"
                  id="node-comilog"
                  onClick={() => setSelectedNode('comilog')}
                  className={`absolute left-[40px] top-[340px] w-60 bg-amber-50/40 border-2 border-amber-400 shadow-sm rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'comilog' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded">3차 채굴</span>
                    <span className="text-xs font-mono text-amber-700 font-bold">중위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">Comilog 가봉 광산 자산</p>
                  <p className="text-sm text-amber-800 mt-1 font-semibold">망간 광석 채굴 및 파쇄 공정</p>
                </button>

                {/* Rio Tinto (고위험: 붉은 테마) */}
                <button
                  type="button"
                  id="node-riotinto"
                  onClick={() => setSelectedNode('riotinto')}
                  className={`absolute right-[40px] top-[340px] w-60 bg-red-50/40 border-2 border-red-500 shadow-sm rounded-xl p-4 text-left transition cursor-pointer focus:outline-none z-10 ${selectedNode === 'riotinto' ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">3차 채굴</span>
                    <span className="text-xs font-mono text-red-700 font-bold">고위험</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">Rio Tinto 보크사이트 인프라</p>
                  <p className="text-sm text-red-800 mt-1 font-semibold">보크사이트(알루미늄 원광) 수급</p>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 우측 영역 - 명세서 패널 (4열 / h-full flex flex-col 설정으로 좌측과 높이 매칭) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            {/* 명세서 헤더 및 매핑 스탬프 버전 표기 */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm md:text-base font-bold">선택 협력사 명세</h3>
                <p id="selected-company-title" className="text-xs md:text-sm text-emerald-400 font-bold mt-0.5">
                  {nodeDetail.title}
                </p>
              </div>
            </div>

            {/* justify-start 및 tight spacing 조율을 통해 공백 제거 및 꽉 찬 레이아웃 구성 */}
            <div className="p-5 space-y-6 flex-1 flex flex-col justify-start overflow-y-auto">

              <div className="space-y-5">
                {/* BOM 정보 영역 */}
                <div className="space-y-3">
                  <h4 className="text-xs md:text-sm font-bold text-emerald-600 uppercase tracking-wider pb-1.5 border-b border-gray-100">BOM 정보</h4>
                  <div className="grid grid-cols-1 gap-2.5 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">품번</span>
                      <span id="bom-part-no" className="font-bold text-gray-800 font-mono">{nodeDetail.partNo}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">투입 부품명</span>
                      <span id="bom-part" className="font-bold text-gray-800">{nodeDetail.part}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">BOM 단위 중량</span>
                      <span id="bom-weight" className="font-bold text-gray-800">{nodeDetail.weight}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">BOM 소요 수량</span>
                      <span id="bom-qty" className="font-bold text-gray-800">{nodeDetail.qty}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400 font-medium">공정내 리드타임</span>
                      <span id="bom-leadtime" className="font-bold text-gray-800">{nodeDetail.leadtime}</span>
                    </div>
                  </div>
                </div>

                {/* 원자재 정보 영역 */}
                <div className="space-y-3">
                  <h4 className="text-xs md:text-sm font-bold text-emerald-600 uppercase tracking-wider pb-1.5 border-b border-gray-100">원자재 정보</h4>
                  <div className="grid grid-cols-1 gap-2.5 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">원자재 스펙명</span>
                      <span id="mat-spec" className="font-bold text-gray-800">{nodeDetail.spec}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">소재지/원산지</span>
                      <span id="mat-origin" className="font-bold text-gray-800">{nodeDetail.origin}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-gray-400 font-medium">자재 치수 사양</span>
                      <span id="mat-dim" className="font-bold text-gray-800">{nodeDetail.dim}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 화학 구성요소 비율 */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <p className="text-xs md:text-sm font-bold text-gray-500">주요 화학 구성요소 비율 명세</p>
                <div id="chemical-container" className="space-y-3 text-xs md:text-sm">
                  {chemItems.map((item) => {
                    const barColor = "bg-emerald-500";
                    const widthPercent = getWidthPercent(item.key, item.rawVal);
                    const styleWidth = animate ? `${widthPercent}%` : '0%';

                    return (
                      <div key={item.key}>
                        <div className="flex justify-between mb-1 text-gray-600 font-semibold text-xs md:text-sm">
                          <span>{item.label}</span>
                          <span className="font-bold">{item.unitVal}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`${barColor} h-full rounded-full transition-all duration-500 ease-out`}
                            style={{ width: styleWidth }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupplyChainMapDetail;
