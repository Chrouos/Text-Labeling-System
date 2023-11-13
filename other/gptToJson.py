import os
import json
import pandas as pd

# 定義來源和目標資料夾
source_file_path = './other/random_100_gpt.txt'
uploads_processed_dir = './src/server/uploads/processed/'
target_file_name = 'random_900_0.txt'
df = pd.read_json(source_file_path, lines=True)

write_content = []
with open(uploads_processed_dir + target_file_name, 'r', encoding='utf-8') as file:
    for file_index, line in enumerate(file):
        data = json.loads(line)
        
        # 更新 uploads_processed_file 的 processed 欄位
        for processed_index, processed_row in enumerate(data['processed']):
            for key, value in processed_row.items():
                if key == "name" and value in df.columns:
                    cell_value = df.loc[file_index, value]
                    if pd.isna(cell_value):
                        data['processed'][processed_index]['gpt_value'] = ""
                    else:
                        if isinstance(cell_value, pd.Int64Dtype().type):  # 檢查是否為 int64
                            data['processed'][processed_index]['gpt_value'] = int(cell_value)  # 轉換為 int
                        else:
                            data['processed'][processed_index]['gpt_value'] = cell_value
                    
        
        write_content.append(data)
        
print(write_content[0])
        
# @ 寫入到新的目錄中
processed_file_path = os.path.join(uploads_processed_dir, target_file_name)
with open(processed_file_path, 'w', encoding='utf-8') as processed_file:
    for item in write_content:
        processed_file.write(json.dumps(item, ensure_ascii=False))
        processed_file.write('\n')