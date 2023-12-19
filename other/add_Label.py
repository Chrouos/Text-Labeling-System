import json
import os

user = 'test'
# files_folder = './src/server/uploads/files/' + user 
files_folder = './other/change_file'
process_folder = './src/server/uploads/processed/' + user

label = 'opinion'

# 創建一個字典來存儲第二個文件夾的數據
judgements = {}

# 讀取第二個文件夾的文件
for filename in os.listdir(files_folder):
    if filename.endswith('.txt'):
        with open(os.path.join(files_folder, filename), 'r', encoding='utf-8') as file:
            for line in file:
                data = json.loads(line)
                clean_judgement = data.get('cleanJudgement')
                judgement = data.get(label)
                if clean_judgement and judgement:
                    judgements[clean_judgement] = judgement

# 更新第一個文件夾的文件
for filename in os.listdir(process_folder):
    if filename.endswith('.txt'):
        file_path = os.path.join(process_folder, filename)
        updated_lines = []
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                data = json.loads(line)
                clean_judgement = data.get('cleanJudgement')
                if clean_judgement and clean_judgement in judgements:
                    data[label] = judgements[clean_judgement]
                updated_lines.append(json.dumps(data, ensure_ascii=False))

        # 寫回更新後的內容
        with open(file_path, 'w', encoding='utf-8') as file:
            for line in updated_lines:
                file.write(line + '\n')

# 使用函數
