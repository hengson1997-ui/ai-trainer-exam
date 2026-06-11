#!/usr/bin/env python3
import json
import sys
import re
sys.stdout.reconfigure(encoding='utf-8')

# 读取题目数据
with open('D:/AI/AI训练师课程与考证/exam-system/src/data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# 知识点关键词映射
knowledge_keywords = {
    'ETL': 'ETL数据处理流程',
    'Kettle': 'Kettle数据集成工具',
    '爬虫': '网络爬虫技术',
    '数据清洗': '数据清洗方法',
    '数据质量': '数据质量评估',
    '特征': '特征工程',
    '模型': '机器学习模型',
    '训练': '模型训练',
    '标注': '数据标注',
    '神经网络': '神经网络',
    '深度学习': '深度学习',
    '机器学习': '机器学习',
    '算法': '算法基础',
    '分类': '分类算法',
    '聚类': '聚类算法',
    '回归': '回归分析',
    '数据采集': '数据采集技术',
    '数据存储': '数据存储管理',
    '数据库': '数据库管理',
    'SQL': 'SQL查询',
    'Python': 'Python编程',
    'Matplotlib': '数据可视化',
    '图表': '数据可视化',
    '测试': '软件测试',
    '需求': '需求分析',
    '设计': '界面设计',
    '交互': '人机交互',
    '用户体验': '用户体验设计',
    '职业': '职业道德',
    '法律': '法律法规',
    '隐私': '隐私保护',
    '安全': '信息安全',
    '流程': '业务流程',
    '优化': '流程优化',
    '统计': '统计分析',
    '概率': '概率统计',
    '可视化': '数据可视化',
    'Excel': 'Excel办公软件',
    'Word': 'Word文档处理',
    '浏览器': '浏览器应用',
    '网络': '计算机网络',
    '操作系统': '操作系统',
    '知识产权': '知识产权保护',
    '著作权': '著作权法',
    '专利': '专利法',
}

def detect_knowledge_point(question_text):
    """检测题目涉及的知识点"""
    for keyword, knowledge in knowledge_keywords.items():
        if keyword in question_text:
            return knowledge
    return '本领域知识'

def extract_correct_option_text(question):
    """提取正确选项的文本"""
    answer = question.get('answer', '')
    options = question.get('options', [])
    
    # 找到正确选项的文本
    correct_texts = []
    for opt in options:
        match = re.match(r'^([A-Z])[\.、．]\s*(.+)$', opt)
        if match:
            letter, text = match.groups()
            if letter in answer:
                correct_texts.append(text.strip())
    
    return '、'.join(correct_texts) if correct_texts else answer

def generate_explanation(question):
    """为题目生成解析"""
    q_type = question['type']
    q_text = question['question']
    answer = question.get('answer', '')
    
    knowledge = detect_knowledge_point(q_text)
    correct_text = extract_correct_option_text(question)
    
    if q_type == '判断题':
        if answer == '√':
            return f'本题考查{knowledge}。答案是正确的，该表述符合相关知识点的定义和要求。'
        else:
            return f'本题考查{knowledge}。答案是错误的，该表述不符合相关知识点的定义和要求。'
    
    elif q_type == '单选题':
        if len(answer) == 1:
            return f'本题考查{knowledge}。正确答案是{answer}，{correct_text}。'
        else:
            return f'本题考查{knowledge}。正确答案是{answer}，{correct_text}。'
    
    elif q_type == '多选题':
        return f'本题考查{knowledge}。正确答案是{answer}，涉及{correct_text}等知识点。'
    
    return f'本题考查{knowledge}。正确答案是{answer}。'

# 为没有解析的题目生成解析
generated_count = 0
for q in questions:
    if not q.get('explanation') or not q['explanation'].strip():
        q['explanation'] = generate_explanation(q)
        generated_count += 1

# 保存更新后的题目数据
with open('D:/AI/AI训练师课程与考证/exam-system/src/data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f'已为 {generated_count} 道题目生成解析')
print(f'当前总题数: {len(questions)}')

# 验证
with_explanation = len([q for q in questions if q.get('explanation') and q['explanation'].strip()])
print(f'有解析的题目: {with_explanation} ({round(with_explanation/len(questions)*100)}%)')
