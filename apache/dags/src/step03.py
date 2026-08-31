from pprint import pprint
import re

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
                    normUser = str(userValue).strip().upper()
                    if "Y" in op and normUser != "Y": isViolated = True
                    elif "N" in op and normUser != "N": isViolated = True

                elif m_key == "RANGE":
                    min_v, max_v = map(float, th_str.split("~"))
                    if not (min_v <= floatUser <= max_v): isViolated = True

                totalAlertsGenerated += 1
                if isViolated:
                    if severity_upper == "CRITICAL":
                        current_item_risk = '고위험'
                        compCriticalCount += 1
                    elif severity_upper == "HIGH":
                        if current_item_risk != "CRITICAL":
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
