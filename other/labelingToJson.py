import os
import json
import pandas as pd

fileName = 'random_900_0.txt'
uploads_processed_dir = './src/server/uploads/processed/'

# - 讀取 csv 檔案
df = pd.read_csv('./other/random_900_0.csv')


write_content = []
with open(uploads_processed_dir + fileName, 'r', encoding='utf-8') as file:
    for file_index, line in enumerate(file):
        data = json.loads(line)
        
        # 更新 uploads_processed_file 的 processed 欄位
        for processed_index, processed_row in enumerate(data['processed']):
            for key, value in processed_row.items():
                if key == "name" and value in df.columns:
                    cell_value = df.loc[file_index, value]
                    if pd.isna(cell_value):
                        data['processed'][processed_index]['value'] = ""
                    else:
                        if isinstance(cell_value, pd.Int64Dtype().type):  # 檢查是否為 int64
                            data['processed'][processed_index]['value'] = int(cell_value)  # 轉換為 int
                        else:
                            data['processed'][processed_index]['value'] = cell_value
                    
        
        write_content.append(data)
        
        
# # @ 寫入到新的目錄中
processed_file_path = os.path.join(uploads_processed_dir, fileName)
with open(processed_file_path, 'w', encoding='utf-8') as processed_file:
    for item in write_content:
        processed_file.write(json.dumps(item, ensure_ascii=False))
        processed_file.write('\n')