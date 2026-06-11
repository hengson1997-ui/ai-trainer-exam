#!/usr/bin/env python3
import sys
import re
import json
sys.stdout.reconfigure(encoding='utf-8')

# Read the question file
with open('D:/AI/AI训练师课程与考证/人工智能训练师三级题库汇总_新.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse questions
questions = []
current_category = ''
current_type = ''
lines = content.split('\n')

i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # Category
    if line.startswith('## ') and '题目数量' not in line and '目录' not in line:
        current_category = line[3:].strip()
    
    # Type
    elif line.startswith('### '):
        current_type = line[4:].strip()
    
    # Question
    elif line.startswith('**') and '.' in line[:10]:
        question_text = line.strip('*').strip()
        options = []
        answer = ''
        explanation = ''
        
        # Parse next lines for options, answer, explanation
        j = i + 1
        while j < len(lines):
            next_line = lines[j].strip()
            
            # Option
            if next_line.startswith('- ') and re.match(r'^- [A-Z]\.', next_line):
                options.append(next_line[2:])
            
            # Answer
            elif next_line.startswith('- 答案：'):
                answer = next_line.replace('- 答案：', '').strip('*').strip()
            
            # Explanation
            elif next_line.startswith('- 解析：'):
                explanation = next_line.replace('- 解析：', '')
            
            # Next question or category
            elif next_line.startswith('**') and '.' in next_line[:10]:
                break
            elif next_line.startswith('## ') or next_line.startswith('### '):
                break
            
            j += 1
        
        if question_text and answer:
            questions.append({
                'id': len(questions) + 1,
                'category': current_category,
                'type': current_type,
                'question': question_text,
                'options': options,
                'answer': answer,
                'explanation': explanation
            })
        
        i = j
        continue
    
    i += 1

# Save to JSON
with open('D:/AI/AI训练师课程与考证/exam-system/src/data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f'Total questions: {len(questions)}')
print(f'Categories: {len(set(q["category"] for q in questions))}')
print(f'Types: {len(set(q["type"] for q in questions))}')
