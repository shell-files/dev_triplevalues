import React, { useState } from "react";
import { Card } from "@components/Common/Card";
import { RChip } from "@components/Common/Chip";

const MOCK_CHECKLIST_DATA = [
  { id: 1, indicator: "Al 3003 합금 Mn 함량 실측", priority: "Critical", question: "귀사의 Al 3003 합금 제품에서 Mn(망간) 함량이 ASTM B209 기준인 1.00~1.50% 범위 내에 있습니까? 히트별 OES/ICP-OES 성분 분석 결과를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. 당사 Al 3003 제품의 Mn 함량은 1.25%로 ASTM B209 기준(1.00~1.50%) 범위 내에 있습니다. 최근 3개월 히트별 OES 분석 성적서를 첨부합니다.", riskGrade: "저위험" },
  { id: 2, indicator: "Al 3003 합금 Cu 함량 실측", priority: "High", question: "귀사의 Al 3003 합금 제품에서 Cu(구리) 함량이 ASTM B209 기준인 0.05~0.20% 범위 내에 있습니까? 로트별 ICP-OES/XRF 분석 결과를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. Cu 함량은 0.12%로 ASTM B209 기준(0.05~0.20%) 범위 내에 있습니다. 로트별 ICP-OES 성적서를 첨부합니다.", riskGrade: "저위험" },
  { id: 3, indicator: "Al 3003 Si 최대 함량", priority: "High", question: "귀사의 Al 3003 합금 제품에서 Si(규소) 함량이 ASTM 기준 최대 0.60% 이하입니까?", evidenceRequired: "Y", answer: "예. Si 함량은 0.28%로 기준(≤0.60%) 이내입니다.", riskGrade: "저위험" },
  { id: 4, indicator: "Al 3003 Fe 최대 함량", priority: "High", question: "귀사의 Al 3003 합금 제품에서 Fe(철) 함량이 ASTM 기준 최대 0.70% 이하입니까?", evidenceRequired: "Y", answer: "예. Fe 함량은 0.45%로 기준(≤0.70%) 이내입니다.", riskGrade: "저위험" },
  { id: 5, indicator: "균질화 처리 조건", priority: "High", question: "귀사의 Al 3003 합금 균질화 처리 시 온도 600°C(±10°C)에서 12시간 유지 조건을 충질하고 있습니까? 열처리 로그 데이터를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. 균질화 처리 조건 600°C×12h(±10°C)를 충족하고 있습니다. 최근 배치별 열처리 로그 데이터를 첨부합니다.", riskGrade: "저위험" },
  { id: 6, indicator: "열간 압연 조건", priority: "High", question: "귀사의 열간 압연 공정에서 시작 온도 480°C(±15°C), 종료 온도 300°C(±15°C)를 준수하고 있습니까?", evidenceRequired: "Y", answer: "예. 열간 압연 시작 478°C / 종료 305°C로 기준 범위 내입니다.", riskGrade: "저위험" },
  { id: 7, indicator: "H14 temper 인장강도", priority: "High", question: "귀사의 H14 temper 제품의 인장강도(UTS)가 150 MPa 이상이고 경도(HB)가 40 이상입니까? UTM 시험 성적서를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. UTS 162 MPa, HB 43으로 기준(UTS≥150, HB≥40)을 충족합니다.", riskGrade: "저위험" },
  { id: 8, indicator: "H16 temper 인장강도", priority: "Medium", question: "귀사의 H16 temper 제품의 인장강도(UTS)가 180 MPa 이상이고 경도(HB)가 47 이상입니까?", evidenceRequired: "Y", answer: "예. UTS 195 MPa, HB 50으로 기준을 충족합니다.", riskGrade: "저위험" },
  { id: 9, indicator: "O temper 인장강도 (완전소둔)", priority: "Medium", question: "귀사의 O temper(완전소둔) 제품의 인장강도(UTS)가 110 MPa 이상입니까?", evidenceRequired: "Y", answer: "예. UTS 118 MPa로 기준(≥110 MPa)을 충족합니다.", riskGrade: "저위험" },
  { id: 10, indicator: "압연 공정 에너지 원단위", priority: "High", question: "귀사의 Al 3003 압연 공정 에너지 원단위가 2.5 GJ/t 이하입니까? 에너지 사용 현황 보고서를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. 압연 공정 에너지 원단위는 2.3 GJ/t-Al로 기준(≤2.5)을 충족합니다. 에너지 사용 현황 보고서를 첨부합니다.", riskGrade: "저위험" },
  { id: 11, indicator: "가공 단계 Scope 1+2 GHG", priority: "High", question: "귀사의 Al 3003 가공 단계 Scope 1+2 GHG 배출량이 0.7 tCO₂/t 이하입니까? 온실가스 배출량 검증 보고서를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. Scope 1+2 GHG 배출량은 0.62 tCO₂/t-Al로 기준(≤0.7)을 충족합니다. 제3자 검증 보고서를 첨부합니다.", riskGrade: "저위험" },
  { id: 12, indicator: "RoHS 10대 제한물질 함유량", priority: "High", question: "귀사 제품이 EU RoHS 지침의 10대 제한물질 기준치를 전부 충족합니까? (Pb≤1,000ppm 등) RoHS 시험 성적서를 제출해 주십시오.", evidenceRequired: "Y", answer: "Pb 함량이 1,250ppm으로 기준(≤1,000ppm)을 초과합니다.", riskGrade: "고위험" },
  { id: 13, indicator: "REACH SVHC 후보물질 관리", priority: "High", question: "귀사에서 사용하는 전체 화학물질이 ECHA SVHC 후보물질 리스트와 대조 완료되었습니까? SVHC 대조 현황 보고서를 제출해 주십시오.", evidenceRequired: "Y", answer: "사용 물질 82종 중 35종이 SVHC 대조 미완료 상태입니다.", riskGrade: "고위험" },
  { id: 14, indicator: "SDS(안전보건자료) 완비율", priority: "Medium", question: "귀사에서 사용하는 전체 화학물질에 대한 SDS(안전보건자료)를 100% 확보하고 있습니까?", evidenceRequired: "Y", answer: "사용 물질 82종 중 Mn 분말, 압연유에 대한 SDS가 미확보 상태입니다.", riskGrade: "중위험" },
  { id: 15, indicator: "강제노동·아동노동 Zero (합금)", priority: "Critical", question: "귀사는 강제노동·아동노동 Zero 선언을 수행하고 연간 제3자 감사를 실시하고 있습니까? 최근 감사 보고서를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. 2025년 강제·아동노동 Zero 선언을 수행하였으며, SGS 제3자 사회감사를 연 1회 실시하고 있습니다. 감사 보고서를 첨부합니다.", riskGrade: "저위험" },
  { id: 16, indicator: "고충처리 메커니즘", priority: "High", question: "귀사는 CSDDD Art.14에 따른 고충처리 메커니즘(핫라인/접수 채널)을 운영하고 있으며, 접수 건수를 공개하고 있습니까?", evidenceRequired: "N", answer: "예. 다국어 핫라인을 운영 중이며, 2025년 접수 건수 12건, 처리 완료 11건입니다.", riskGrade: "저위험" },
  { id: 17, indicator: "FEOC Mn·Cu 원소 공급사 확인", priority: "Critical", question: "귀사의 Mn(망간)·Cu(구리) 원소 공급사 중 FEOC(외국 우려 기관) 해당 기업이 있습니까? 공급사 지분 구조 확인서를 제출해 주십시오.", evidenceRequired: "Y", answer: "아니요. 당사의 Mn·Cu 공급사 중 FEOC 해당 기업은 0%입니다. 공급사별 지분 구조 확인서를 첨부합니다.", riskGrade: "저위험" }
];

const MOCK_SUB_CHECKLIST_DATA = [
  { id: 1, indicator: "전력 탄소집약도", priority: "High", question: "귀사의 전력 탄소집약도가 300 gCO₂/kWh 이하입니까? 전력 구매 계약(PPA) 및 전력 믹스 현황을 제출해 주십시오.", evidenceRequired: "Y", answer: "예. 전력 탄소집약도 180 gCO₂/kWh입니다. 수력 기반 전력을 사용합니다.", riskGrade: "저위험" },
  { id: 2, indicator: "재생에너지 비율", priority: "High", question: "귀사의 전력 소비 중 재생에너지 비율이 50% 이상입니까?", evidenceRequired: "Y", answer: "예. 재생에너지 비율 72%입니다. (수력 60% + 태양광 12%)", riskGrade: "저위험" },
  { id: 3, indicator: "Scope 1+2 GHG (제련)", priority: "High", question: "귀사의 알루미늄 제련 Scope 1+2 GHG 배출량이 4.0 tCO₂e/t-Al 이하입니까?", evidenceRequired: "Y", answer: "예. Scope 1+2 배출량 3.2 tCO₂e/t-Al로 기준 이내입니다.", riskGrade: "저위험" },
  { id: 4, indicator: "에너지 원단위 (Hall-Héroult)", priority: "High", question: "귀사의 Hall-Héroult 공정 에너지 원단위가 13.5 kWh/kg-Al 이하입니까?", evidenceRequired: "Y", answer: "에너지 원단위 16.8 kWh/kg-Al로 불합격 기준(>16.0)을 초과합니다.", riskGrade: "고위험" },
  { id: 5, indicator: "PFC 가스 배출량 (CF₄·C₂F₆)", priority: "Critical", question: "귀사의 CF₄ 배출량이 0.1 kg/t-Al 미만입니까? 양극효과(Anode Effect) 발생 빈도를 보고해 주십시오.", evidenceRequired: "Y", answer: "CF₄ 배출량 2.5 kg/t-Al로 불합격 기준(>2.0)을 초과합니다.", riskGrade: "고위험" },
  { id: 6, indicator: "탄소양극 소모량", priority: "Medium", question: "귀사의 탄소양극 소모량이 0.42 kg/kg-Al 이하입니까?", evidenceRequired: "Y", answer: "탄소양극 소모량 0.58 kg/kg-Al로 불합격 기준(>0.55)을 초과합니다.", riskGrade: "고위험" },
  { id: 7, indicator: "불화물(HF) 배출량", priority: "High", question: "귀사의 불화물(HF) 배출량이 0.5 kg/t-Al 이하입니까?", evidenceRequired: "Y", answer: "예. HF 배출량 0.3 kg/t-Al로 EU BAT BREF 기준 이내입니다.", riskGrade: "저위험" },
  { id: 8, indicator: "PAH·다이옥신 배출", priority: "High", question: "귀사의 PAH 배출이 1 ng/m³ 이하이고, 다이옥신이 0.1 ng-TEQ/m³ 이하입니까?", evidenceRequired: "Y", answer: "예. PAH 0.5 ng/m³, 다이옥신 0.05 ng-TEQ/m³로 기준 이내입니다.", riskGrade: "저위험" },
  { id: 9, indicator: "전해질 SVHC (빙정석 Na₃AlF₆)", priority: "High", question: "귀사는 빙정석(Na₃AlF₆) 등 전해질 SVHC에 대해 대체 계획 또는 REACH 인가를 취득하였습니까?", evidenceRequired: "Y", answer: "미신고 SVHC(빙정석 포함)를 사용하고 있습니다.", riskGrade: "고위험" },
  { id: 10, indicator: "SPL(폐전해질) 처리 적합성", priority: "High", question: "귀사의 SPL(폐전해질)이 허가된 특수처리업체에 위탁 처리되고 있습니까?", evidenceRequired: "Y", answer: "비허가 업체에 SPL을 위탁하고 있습니다.", riskGrade: "고위험" },
  { id: 11, indicator: "FEOC 제련소 지분 (Hall-Héroult)", priority: "Critical", question: "귀사의 지분 구조에서 FEOC 해당 기관의 지분 합산이 25% 미만입니까? DOE FEOC 3개 독립지표(의결권·지분율·이사회 의석) 확인서를 제출해 주십시오.", evidenceRequired: "Y", answer: "FEOC 해당 지분 합산 42%입니다.", riskGrade: "고위험" },
  { id: 12, indicator: "강제노동 Zero 감사 (제련)", priority: "Critical", question: "귀사는 강제노동·아동노동 Zero 선언을 수행하고 연간 제3자 감사를 실시하고 있습니까?", evidenceRequired: "Y", answer: "예. 2025년 Zero 선언 완료, SGS 제3자 감사 결과 위반 0건입니다.", riskGrade: "저위험" }
];

const MOCK_CHECKLIST_A = [
  { id: 1, indicator: "아동·강제노동 Zero 확인", priority: "Critical", question: "귀사는 보크사이트 채굴 현장에서 아동노동 및 강제노동이 전혀 없음을 확인하였습니까? ILO 감사기관(SGS/Bureau Veritas)의 확인서를 제출해 주십시오.", evidenceRequired: "Y", answer: "아동노동 1건이 현장 감사에서 확인되었습니다.", riskGrade: "고위험" },
  { id: 2, indicator: "근로자 계약 유형 및 비율", priority: "High", question: "귀사 채굴 현장의 정규직 비율이 80% 이상입니까? 근로계약 유형별 비율 현황 자료를 제출해 주십시오.", evidenceRequired: "Y", answer: "정규직 비율이 42%로 기준(80%) 미달입니다.", riskGrade: "고위험" },
  { id: 3, indicator: "결사의 자유·단체교섭권 보장", priority: "High", question: "귀사는 근로자의 결사의 자유 및 단체교섭권을 보장하는 정책을 수립·실행하고 있습니까?", evidenceRequired: "N", answer: "아니요. 결사의 자유 관련 정책이 부재합니다.", riskGrade: "고위험" },
  { id: 4, indicator: "산업안전 TRIR", priority: "High", question: "귀사의 산업안전 TRIR(총 기록 가능 사고율)이 2.0건/백만시간 이하입니까? TRIR 산정 기초 자료를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. TRIR 1.85건/백만시간으로 기준(≤2.0) 이내입니다.", riskGrade: "저위험" },
  { id: 5, indicator: "신장(위구르) 원산지 여부", priority: "Critical", question: "귀사의 원자재(보크사이트) 원산지가 중국 신장(위구르) 지역과 관련이 있습니까?", evidenceRequired: "Y", answer: "아니요. 신장 원산지 원료 0%입니다. 호주/기니/브라질산만 사용합니다.", riskGrade: "저위험" },
  { id: 6, indicator: "원주민 토지권(FPIC) 취득", priority: "High", question: "귀사의 채굴 부지에 대해 원주민 자유사전동의(FPIC)를 취득하였습니까?", evidenceRequired: "Y", answer: "예. FPIC 절차를 완료하였으며 보고서를 첨부합니다.", riskGrade: "저위험" },
  { id: 7, indicator: "광산 수질 중금속 농도", priority: "High", question: "귀사 광산 인근 수질의 중금속 농도(As, Cd, Pb)가 WHO 식수기준 이하입니까? (As≤0.05, Cd≤0.003, Pb≤0.01 mg/L)", evidenceRequired: "Y", answer: "예. 최근 검사 결과 As 0.02, Cd 0.001, Pb 0.005 mg/L로 전부 기준 이내입니다.", riskGrade: "저위험" },
  { id: 8, indicator: "보크사이트 Al₂O₃ 함량", priority: "High", question: "귀사의 보크사이트 광석 Al₂O₃ 함량이 28% 이상이고 SiO₂가 7% 미만입니까?", evidenceRequired: "Y", answer: "예. Al₂O₃ 42%, SiO₂ 3.8%로 기준을 충족합니다.", riskGrade: "저위험" },
  { id: 9, indicator: "토양 복원 계획 수립", priority: "High", question: "귀사는 IRMA 수준의 채굴지 토양 복원 계획을 수립하고 이행하고 있습니까?", evidenceRequired: "Y", answer: "예. IRMA Ch.4.1 기준 복원 계획을 수립하고 연간 이행 중입니다.", riskGrade: "저위험" },
  { id: 10, indicator: "용수 사용량 및 재활용률", priority: "Medium", question: "귀사의 채굴 공정 용수 재활용률이 50% 이상입니까?", evidenceRequired: "Y", answer: "용수 재활용률 15%로 기준(≥50%)에 크게 미달합니다.", riskGrade: "중위험" },
  { id: 11, indicator: "폐기물 매립 비율", priority: "Medium", question: "귀사의 채굴 폐기물 매립 비율이 20% 이하입니까?", evidenceRequired: "Y", answer: "매립률 65%로 불합격 기준(>60%)을 초과합니다.", riskGrade: "중위험" },
  { id: 12, indicator: "Scope 1 GHG (채굴 단계)", priority: "High", question: "귀사의 보크사이트 채굴 단계 Scope 1 GHG 배출량이 0.05 tCO₂e/t-보크사이트 이하입니까?", evidenceRequired: "Y", answer: "예. Scope 1 배출량 0.04 tCO₂e/t-보크사이트로 기준 이내입니다.", riskGrade: "저위험" },
  { id: 13, indicator: "채굴 화학약품 REACH 등록", priority: "High", question: "귀사가 채굴 공정에서 사용하는 모든 화학약품이 REACH 등록이 완료되어 있습니까?", evidenceRequired: "Y", answer: "예. 사용 화학약품 12종 전량 REACH 등록 완료입니다.", riskGrade: "저위험" },
  { id: 14, indicator: "수은 사용 여부 (미나마타)", priority: "Critical", question: "귀사는 채굴 공정에서 수은(Hg)을 사용하지 않습니까?", evidenceRequired: "Y", answer: "예. 소규모 금 정제 공정에서 수은을 사용하고 있습니다.", riskGrade: "고위험" },
  { id: 15, indicator: "공급망 실사 정책 수립", priority: "High", question: "귀사는 OECD 실사 가이드라인에 따른 공급망 실사 정책을 문서화하고 연 1회 이상 검토하고 있습니까?", evidenceRequired: "Y", answer: "예. OECD Step 1~6 기반 실사 정책을 수립하고 연 1회 검토합니다.", riskGrade: "저위험" },
  { id: 16, indicator: "고충처리 메커니즘 운영", priority: "High", question: "귀사는 CSDDD Art.14에 따른 고충처리 메커니즘(핫라인 등)을 운영하고 접수 건수를 추적하고 있습니까?", evidenceRequired: "N", answer: "예. 다국어 핫라인을 운영 중이며 2025년 접수 8건, 처리 완료 7건입니다.", riskGrade: "저위험" },
  { id: 17, indicator: "FEOC 해당 원료 비중", priority: "Critical", question: "귀사의 원자재 중 FEOC(외국 우려 기관) 해당 원료의 비중이 0%입니까? FEOC 해당 여부 자체 점검 결과를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. FEOC 해당 원료 비중이 30%입니다. 중국 국영기업 경유 원료 포함.", riskGrade: "고위험" }
];

const MOCK_CHECKLIST_B = [
  { id: 1, indicator: "알루미나(Al₂O₃) 순도", priority: "Critical", question: "귀사의 알루미나(Al₂O₃) 순도가 IAI SGA 기준 99.35% 이상이고 Na₂O가 0.35% 미만입니까? 알루미나 성적서(COA)를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. Al₂O₃ 99.52%, Na₂O 0.28%로 IAI SGA 기준을 충족합니다. COA를 첨부합니다.", riskGrade: "저위험" },
  { id: 2, indicator: "Bayer 용출 조건 준수", priority: "High", question: "귀사의 Bayer 공정 용출 조건(온도·압력·농도)이 SOP 기준 ±5% 이내로 유지되고 있습니까?", evidenceRequired: "Y", answer: "예. 공정 조건 ±3% 이내로 유지 중이며 SOP를 준수합니다.", riskGrade: "저위험" },
  { id: 3, indicator: "레드머드 발생량 및 처리", priority: "High", question: "귀사의 레드머드 처리 방식은 건식 스택킹 또는 2중 방수 습식 저장 중 하나입니까? (야외 개방형 습식 저장은 불합격)", evidenceRequired: "Y", answer: "야외 개방형 습식 저장으로 처리하고 있습니다.", riskGrade: "고위험" },
  { id: 4, indicator: "용수 소비 (Bayer)", priority: "Medium", question: "귀사의 Bayer 공정 용수 재사용률이 60% 이상입니까?", evidenceRequired: "Y", answer: "용수 재사용률 25%로 기준(≥60%)에 크게 미달합니다.", riskGrade: "저위험" },
  { id: 5, indicator: "Bayer 공정 CO₂ 배출", priority: "High", question: "귀사의 Bayer 공정 CO₂ 배출량이 0.4 tCO₂/t-Al₂O₃ 이하입니까?", evidenceRequired: "Y", answer: "CO₂ 배출량 0.92 tCO₂/t-Al₂O₃로 불합격 기준(>0.8)을 초과합니다.", riskGrade: "고위험" },
  { id: 6, indicator: "Bayer 공정 에너지 원단위", priority: "High", question: "귀사의 Bayer 공정 에너지 원단위가 10 GJ/t-Al₂O₃ 이하입니까?", evidenceRequired: "Y", answer: "에너지 원단위 17.5 GJ/t-Al₂O₃로 불합격 기준(>16)을 초과합니다.", riskGrade: "고위험" },
  { id: 7, indicator: "NaOH 소모량 (신규 투입)", priority: "Medium", question: "귀사의 Bayer 공정 NaOH 소모량이 100 kg/t-Al₂O₃ 이하입니까?", evidenceRequired: "Y", answer: "NaOH 소모량 168 kg/t-Al₂O₃로 불합격 기준(>150)을 초과합니다.", riskGrade: "중위험" },
  { id: 8, indicator: "Bayer 공정 SVHC 관리", priority: "High", question: "귀사의 Bayer 공정에서 사용하는 SVHC 물질에 대한 대체 계획 또는 REACH 인가를 취득하였습니까?", evidenceRequired: "Y", answer: "예. SVHC 해당 물질에 대한 대체 계획을 수립하고 REACH 인가를 취득하였습니다.", riskGrade: "저위험" },
  { id: 9, indicator: "FEOC 제련소 지분 구조", priority: "Critical", question: "귀사의 지분 구조에서 FEOC 해당 기관의 지분이 25% 미만입니까? 지분 구조 확인서를 제출해 주십시오.", evidenceRequired: "Y", answer: "예. FEOC 해당 지분이 35%입니다.", riskGrade: "고위험" }
];

const PartnerDetail = ({ partner, partnerRegistration, onBack }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [openCards, setOpenCards] = useState({});
  const [selectedVersion, setSelectedVersion] = useState("v2");

  const p = partner || {};

  const handleToggleCard = (id) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRiskColor = (risk) => {
    if (risk === "고위험") return "text-red-600 bg-red-50 border-red-100";
    if (risk === "중위험") return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  const getTierBadgeClass = (tier) => {
    if (tier === 1) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (tier === 2) return "bg-sky-50 text-sky-700 border border-sky-100";
    if (tier === 3) return "bg-purple-50 text-purple-700 border border-purple-100";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const formatNum = (val) => {
    if (val === undefined || val === null || val === "") return "-";
    return Number(val).toLocaleString();
  };

  const renderCertBadge = (val) => {
    const isY = val === "Y";
    return (
      <span className={"inline-block text-[10px] px-2 py-0.5 rounded font-bold border text-center " + (isY ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100")}>
        {isY ? "Y (준수)" : "N (미준수)"}
      </span>
    );
  };

  const getPriorityBadgeClass = (priority) => {
    if (priority === "Critical") {
      return "bg-red-100 text-red-800 border border-red-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    }
    if (priority === "High") {
      return "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    }
    return "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
  };

  const getRiskGradeBadgeClass = (riskGrade) => {
    if (riskGrade === "고위험") {
      return "bg-red-100 text-red-800 border border-red-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    }
    if (riskGrade === "중위험") {
      return "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
    }
    return "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm px-4 py-2 text-xs font-black rounded-full whitespace-nowrap";
  };

  const handleDownload = (filename) => {
    alert(`[모의 다운로드] ${filename} 파일의 다운로드를 시작합니다.`);
  };

  const renderFileList = (files) => {
    const isScrollable = files.length >= 5;
    return (
      <div className={isScrollable ? "max-h-60 overflow-y-auto pr-1 space-y-2" : "space-y-2"}>
        {files.map((file, idx) => (
          <div
            key={idx}
            className="bg-slate-50/60 border border-gray-100 p-3 rounded-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="bg-gray-100 text-gray-400 font-bold rounded-lg w-7 h-7 flex items-center justify-center text-xs shrink-0 font-mono">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-bold text-gray-800 truncate">{file}</span>
            </div>
            <button
              type="button"
              onClick={() => handleDownload(file)}
              className="text-xs px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg font-bold text-gray-700 transition shrink-0"
            >
              다운로드
            </button>
          </div>
        ))}
      </div>
    );
  };

  const getChecklistData = () => {
    if (p.tier === 1) return MOCK_CHECKLIST_DATA;
    if (p.tier === 2) return MOCK_SUB_CHECKLIST_DATA;
    if (p.tier === 3) {
      if (p.tierLabel === "3차-B" || p.tier_label === "3차-B") {
        return [...MOCK_CHECKLIST_A, ...MOCK_CHECKLIST_B];
      }
      return MOCK_CHECKLIST_A;
    }
    return [];
  };

  const checklistItems = getChecklistData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 shadow-2xs"
        >
          ← 목록으로 돌아가기
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#03a94d] tracking-tight">{p.short || p.short_name || "미지정 파트너"}</h1>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getTierBadgeClass(p.tier)}`}>
              {p.tierLabel || p.tier_label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">파트너 코드: {p.id || p.partner_id} | 대표자: {p.ceo_name || p.ceo || "정보 없음"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">종합 위험 등급</span>
          <RChip v={p.risk || p.risk_level} />
        </div>
      </div>

      <div className="flex border-b border-gray-200 text-sm overflow-x-auto select-none">
        {[
          ["info", "협력사 정보"],
          ["selfassess", "자가진단 내역"],
          ["evidence", "증빙 자료 확인"],
          ["factory", "공장 정보 확인"],
        ].map((tab) => (
          <button
            key={tab[0]}
            onClick={() => setActiveTab(tab[0])}
            className={"px-4 py-2.5 font-bold border-b-2 tracking-tight whitespace-nowrap " + (activeTab === tab[0] ? "border-slate-900 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600")}
          >
            {tab[1]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "info" && (
          <div className="flex flex-col space-y-6">
            {/* 1행: 기본 협력사 정보 */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">기본 협력사 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">기업명</span>
                  <span className="font-bold text-gray-800">{p.company_name || p.name || "정보 없음"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">대표자명</span>
                  <span className="font-bold text-gray-800">{p.ceo_name || p.ceo || "정보 없음"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">사업자등록번호</span>
                  <span className="font-mono font-bold text-gray-800">{p.biz_no || p.business_number || "정보 없음"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">설립일</span>
                  <span className="font-mono font-bold text-gray-800">{p.founded || "정보 없음"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">대표 이메일 주소</span>
                  <span className="font-bold text-gray-800">{p.email || "-"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">기업 규모</span>
                  <span className="font-bold text-gray-800">{p.size || "정보 없음"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">소재 국가</span>
                  <span className="font-bold text-gray-800">{p.country || "정보 없음"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">소재지</span>
                  <span className="font-bold text-gray-800">{p.address || "정보 없음"}</span>
                </div>
              </div>
            </Card>

            {/* 2행: ESG 주요 지표 데이터 */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">ESG 주요 지표 데이터</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">Scope 1 (tCO₂e)</span>
                  <span className="font-mono font-bold text-gray-800">{formatNum(p.scope1)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">Scope 2 (tCO₂e)</span>
                  <span className="font-mono font-bold text-gray-800">{formatNum(p.scope2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">FEOC 원료 비중</span>
                  <span className="font-mono font-bold text-gray-800">{p.feoc_ratio !== undefined && p.feoc_ratio !== null ? `${p.feoc_ratio}%` : "-"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold">TRIR 산업안전율</span>
                  <span className="font-mono font-bold text-gray-800">{p.trir !== undefined && p.trir !== null ? p.trir : "-"}</span>
                </div>
              </div>
            </Card>

            {/* 3행: 글로벌 인증 및 이니셔티브 준수 현황 */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">글로벌 인증 및 이니셔티브 준수 현황</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  ["CMRT (분쟁광물 보고 인증 여부)", p.cmrt],
                  ["EMAT (배터리·광물 추적 보고 인증 여부)", p.emat],
                  ["ISO 14001 (환경경영 인증 여부)", p.iso14001],
                  ["ISO 45001 (안전보건 인증 여부)", p.iso45001],
                  ["IATF 16949 (품질경영 인증 여부)", p.iatf],
                  ["RBA (책임 비즈니스 인증 여부)", p.rba],
                  ["RMAP (책임 광물 보증 인증 여부)", p.rmap],
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                    <span className="text-gray-400 font-semibold">{item[0]}</span>
                    {renderCertBadge(item[1])}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "selfassess" && (
          <div className="space-y-3">
            <div className="w-full bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 shadow-3xs mb-4">
              <span className="text-xs font-bold text-gray-600">버전:</span>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="v2">v2 (17건 · 2026. 6. 05.)</option>
                <option value="v1">v1 (11건 · 2026. 5. 28.)</option>
              </select>
            </div>
            {checklistItems.map((item, idx) => {
              const cardKey = `card_${item.id}_${idx}`;
              const isSelected = !!openCards[cardKey];
              return (
                <Card key={cardKey} className="overflow-hidden border-gray-100 hover:border-gray-200 transition-all">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer select-none bg-white gap-4"
                    onClick={() => handleToggleCard(cardKey)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="bg-gray-100 text-gray-400 font-black rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="font-bold text-gray-900 text-sm truncate md:whitespace-normal">
                        {item.question}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={getPriorityBadgeClass(item.priority)}>
                        우선순위: {item.priority.toUpperCase()}
                      </span>
                      <span className={getRiskGradeBadgeClass(item.riskGrade)}>
                        평가: {item.riskGrade}
                      </span>
                      <span className="text-gray-400 font-bold text-sm">
                        {isSelected ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="border-t border-gray-150 p-5 bg-slate-50/40 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-semibold mb-1">지표명</span>
                          <span className="text-xs font-bold text-gray-700">{item.indicator}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-semibold mb-1">증빙자료 필요 여부</span>
                          <div>
                            {item.evidenceRequired === "Y" ? (
                              <span className="inline-block text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                                ⚠️ 증빙서류 필수 제출 대상
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                ✓ 증빙서류 선택 제출
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-semibold mb-1">협력사 답변 (Partner Answer)</span>
                        <textarea
                          readOnly
                          disabled
                          value={item.answer}
                          className="w-full h-24 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none resize-none font-medium"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-6">
            {/* 자가진단 완료 문서 */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">자가진단 완료 문서</h2>
              {renderFileList(["자가진단 체크리스트(1차 협력사).pdf"])}
            </Card>

            {/* 자가진단 증빙 자료 */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">자가진단 증빙 자료</h2>
              {renderFileList(["자가진단 증빙자료_1.pdf", "자가진단 증빙자료_2.jpg"])}
            </Card>

            {/* 글로벌 인증 증빙 자료 */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">글로벌 인증 증빙 자료</h2>
              {renderFileList(["CMRT_v2026.pdf", "EMAT_v2026.pdf", "ISO14001_v2026.pdf", "ISO45001_v2026.pdf", "IATF16949_v2026.pdf", "RBA_v2026.pdf", "RMAP_v2026.pdf"])}
            </Card>

            {/* 행동강령 준수 서약서 */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2">행동강령 준수 서약서</h2>
              {renderFileList(["행동강령 준수 서약서.pdf"])}
            </Card>
          </div>
        )}

        {activeTab === "factory" && (
          <Card className="p-6 bg-white">
            {/* ESG 가중합산 요약 보드 */}
            <div>
              <div className="font-bold text-emerald-600 text-sm mb-2">
                ESG 가중합산 요약 (공장별 이용 비율 반영)
              </div>
              <div className="grid grid-cols-4 border-b border-gray-200 pb-4 mb-4 text-xs">
                <div>
                  <div className="text-gray-400 font-semibold">Scope 1</div>
                  <div className="font-bold text-gray-800 mt-1">352 tCO₂e</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold">Scope 2</div>
                  <div className="font-bold text-gray-800 mt-1">292 tCO₂e</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold">FEOC 비중</div>
                  <div className="font-bold text-gray-800 mt-1">473%</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold">TRIR</div>
                  <div className="font-bold text-gray-800 mt-1">372</div>
                </div>
              </div>
            </div>

            {/* 공장 목록 */}
            <div className="mt-6">
              <div className="border-b border-gray-900 pb-2 mb-4 font-bold text-gray-900 text-sm">
                공장 목록 (2개)
              </div>

              <div className="space-y-3">
                {/* 공장 1 카드 */}
                <div className="border border-gray-900 bg-white rounded-xl p-4 space-y-3 mb-3 last:mb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-gray-900 text-sm">공장1</span>
                      <span className="text-xs text-gray-400 mt-1">공장1 주소지</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[11px]">
                      가동중
                    </span>
                  </div>

                  <div className="grid grid-cols-5 border border-gray-200 rounded-lg divide-x divide-gray-200 bg-white text-xs">
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">이용 비율</div>
                      <div className="font-bold text-gray-800">50%</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">Scope 1</div>
                      <div className="font-bold text-gray-800">553 tCO₂e</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">Scope 2</div>
                      <div className="font-bold text-gray-800">231 tCO₂e</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">FEOC</div>
                      <div className="font-bold text-gray-800">523%</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">TRIR</div>
                      <div className="font-bold text-gray-800">512</div>
                    </div>
                  </div>
                </div>

                {/* 공장 2 카드 */}
                <div className="border border-gray-900 bg-white rounded-xl p-4 space-y-3 mb-3 last:mb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-gray-900 text-sm">공장2</span>
                      <span className="text-xs text-gray-400 mt-1">공장2 주소지</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[11px]">
                      가동중
                    </span>
                  </div>

                  <div className="grid grid-cols-5 border border-gray-200 rounded-lg divide-x divide-gray-200 bg-white text-xs">
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">이용 비율</div>
                      <div className="font-bold text-gray-800">50%</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">Scope 1</div>
                      <div className="font-bold text-gray-800">152 tCO₂e</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">Scope 2</div>
                      <div className="font-bold text-gray-800">353 tCO₂e</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">FEOC</div>
                      <div className="font-bold text-gray-800">423%</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-gray-400 font-semibold mb-1">TRIR</div>
                      <div className="font-bold text-gray-800">232</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PartnerDetail;
