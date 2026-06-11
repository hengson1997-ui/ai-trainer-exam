#!/usr/bin/env python3
import json
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

# 读取题目数据
with open('D:/AI/AI训练师课程与考证/exam-system/src/data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f'原始题目数: {len(questions)}')

# 按内容分组，优先保留有解析的版本
content_groups = {}
for q in questions:
    # 标准化题目内容（去掉题号）
    text = re.sub(r'^\d+[\.、．]\s*', '', q['question']).strip()
    text = re.sub(r'^\d+\.\s*', '', text).strip()
    
    if text not in content_groups:
        content_groups[text] = []
    content_groups[text].append(q)

# 去重：优先保留有解析的版本
deduplicated = []
removed_count = 0

for text, group in content_groups.items():
    if len(group) == 1:
        deduplicated.append(group[0])
    else:
        # 优先选择有解析的版本
        with_explanation = [q for q in group if q.get('explanation') and q['explanation'].strip()]
        if with_explanation:
            deduplicated.append(with_explanation[0])
        else:
            deduplicated.append(group[0])
        removed_count += len(group) - 1

# 重新编号
for i, q in enumerate(deduplicated):
    q['id'] = i + 1

# 保存
with open('D:/AI/AI训练师课程与考证/exam-system/src/data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(deduplicated, f, ensure_ascii=False, indent=2)

print(f'去重后题目数: {len(deduplicated)}')
print(f'移除重复题目: {removed_count}题')

# 验证
with open('D:/AI/AI训练师课程与考证/exam-system/src/data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# 再次检查重复
content_set = set()
final_duplicates = 0
for q in questions:
    text = re.sub(r'^\d+[\.、．]\s*', '', q['question']).strip()
    text = re.sub(r'^\d+\.\s*', '', text).strip()
    if text in content_set:
        final_duplicates += 1
    content_set.add(text)

print(f'去重后验证: 剩余重复 {final_duplicates} 题')
