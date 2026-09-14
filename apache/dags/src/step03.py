from pprint import pprint
import re

# BOOL 지표 답변(OCR 한국어 문장)의 선두 토큰으로 예/아니오를 판별한다.
# 긴 토큰부터 매치해 "아니오"가 "아니"로 잘리지 않게 하고,
# 토큰 뒤는 문자열 끝·공백·구두점이어야 한다 ("네덜란드", "Yellow", "아니다" 는 매치 안 함).
yesNoPattern = re.compile(
    r'^(아니오|아니요|아니|YES|NO|예|네|Y|N)(?=$|[\s.,!?;:)\]}])',
    re.IGNORECASE,
)

def parseYesNo(answerText):
    """답변 문장 선두의 예/아니오를 "Y" / "N" 으로, 판별 불가면 None"""
    if not answerText:
        return None
    m = yesNoPattern.match(str(answerText).strip())
    if not m:
        return None
    token = m.group(1).upper()
    if token in ("예", "네", "Y", "YES"):
        return "Y"
    return "N"

def task3(**context):
    ti = context['ti']
    data1 = ti.xcom_pull(task_ids='AnswerExtraction', key='task1')
    data2 = ti.xcom_pull(task_ids='RuleExtraction', key='task2')

    # 협력사 도메인별 실시간 리스크 등급 카운터
    totalAlertsGenerated = 0
    compCriticalCount = 0
    compHighCount = 0
    compMedium = 0

    qList = []
    
    for ans in data1:
        answerId = ans["answerId"]
        partnerId = ans["partnerId"]
        companyName = ans["companyName"]
        userValue = ans["indicatorNo"]
        user_raw_text = ans["answerText"]
        current_item_risk = "저위험"

        for rule in data2:
            isViolated = False
            ruleId = rule["ruleId"]
            ruleValue = rule["indicatorNo"]
            ruleName = rule["ruleName"]
            actionRequired = rule["actionRequired"]
            m_key = rule["metricKey"]
            th_str = rule["thresholdValue"]
            op = rule["operator"]
            floatUser = 0
            severity_upper = rule["severity"].strip().upper() # (CRITICAL, HIGH, MEDIUM)

            if userValue == ruleValue:
                match1 = re.search(r'함량은\s*(\d+\.\d+)%', user_raw_text)
                if match1:
                    floatUser = float(match1.group(1))

                if m_key == "NUMERIC":
                    floatThreshold = float(th_str)
                    if op == "<" and not (floatUser < floatThreshold): isViolated = True
                    elif op == "<=" and not (floatUser <= floatThreshold): isViolated = True
                    elif op == ">" and not (floatUser > floatThreshold): isViolated = True
                    elif op == ">=" and not (floatUser >= floatThreshold): isViolated = True
                    elif op == "==" and not (floatUser == floatThreshold): isViolated = True
                
                elif m_key == "BOOL":
                    normUser = parseYesNo(user_raw_text)
                    expected = "Y" if "Y" in op else ("N" if "N" in op else None)
                    if expected is not None:
                        # 예/아니오를 판별할 수 없으면 준수를 확인할 수 없으므로 보수적으로 위반 처리한다
                        if normUser is None: isViolated = True
                        elif normUser != expected: isViolated = True

                elif m_key == "RANGE":
                    min_v, max_v = map(float, th_str.split("~"))
                    if not (min_v <= floatUser <= max_v): isViolated = True

                totalAlertsGenerated += 1
                if isViolated:
                    if severity_upper == "CRITICAL":
                        current_item_risk = '고위험'
                        compCriticalCount += 1
                    elif severity_upper == "HIGH":
                        # 한 답변 안에서 등급은 올라가기만 한다 (고위험을 중위험으로 내리지 않음)
                        if current_item_risk != "고위험":
                            current_item_risk = '중위험'
                        compHighCount += 1
                    else:
                        compMedium += 1
                else:
                    compMedium += 1

                qList.append({
                    "answerId": answerId,
                    "partnerId": partnerId,
                    "companyName": companyName,
                    "ruleId": ruleId,
                    "indicatorNo": userValue,
                    "ruleName": ruleName,
                    "actionRequired": actionRequired,
                    "userAnswer": user_raw_text, 
                    "threshold": th_str,
                    "operator": op,
                    "severityUpper": severity_upper,
                    "currentItemRisk": current_item_risk
                })

    ti.xcom_push(key='task3', value=qList)
    ti.xcom_push(key='task3-critical', value=compCriticalCount)
    ti.xcom_push(key='task3-high', value=compHighCount)
    ti.xcom_push(key='task3-medium', value=compMedium)
    ti.xcom_push(key='task3-total', value=totalAlertsGenerated)
