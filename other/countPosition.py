import json
import os

users = ['Y_110502022', 'Z_112522104']
fileNames = ['file_1000_0.txt', 'file_1000_1.txt', 'file_1000_2.txt', 'file_1000_3.txt', 'file_1000_4.txt']
processed_path = './src/server/uploads/processed/'
files_path = './src/server/uploads/files/'


for user in users:
    for fileName in fileNames:
        
        # @ Read "Files" Folder
        contentList = []
        with open(f'{files_path}{user}/{fileName}', 'r', encoding='utf-8') as file:
            for file_index, line in enumerate(file):
                data = json.loads(line)
                
                contentList.append(data['cleanJudgement'])
        
        # @ Read "Processed" Folder
        updated_data = []
        with open(f'{processed_path}{user}/{fileName}', 'r', encoding='utf-8') as file:
            for file_index, line in enumerate(file):
                data = json.loads(line)
                
                # @ 讀取每一個 processed
                for item in data['processed']:
                    name = item['name']
                    value = item['value'].replace('\n', '').replace('\t', '')
                    surrounding_words = item['the_surrounding_words'].replace('\n', '').replace('\t', '')
                    content = contentList[file_index].replace('\n', '').replace('\t', '')
                    
                    # - 比對
                    start_position = -1
                    end_position = -1
                    
                    # @ 先找前後文在哪
                    surrounding_start_index = content.find(str(surrounding_words))
                    
                    # @ 關鍵字在前後文裡面
                    keyword_start_index = surrounding_words.find(str(value))
                    
                    # @ 捕捉位置
                    actual_start_position = surrounding_start_index + keyword_start_index
                    actual_end_position = actual_start_position + len(value)
                    
                    # @ 捕捉位置：例外
                    if actual_start_position == -1 and value != "" and surrounding_words == "":
                        except_keyword_start_index = content.find(str(value))
                        actual_start_position = except_keyword_start_index
                        actual_end_position = actual_start_position + len(value)
                    
                    # @ 添加位置資訊到 item
                    item['position'] = {
                        'start_position': actual_start_position, 
                        'end_position': actual_end_position
                    }
                    
                updated_data.append(data)

        # # @ 將更新後的資料寫回文件
        with open(f'{processed_path}{user}/{fileName}', 'w', encoding='utf-8') as file:
            for data in updated_data:
                file.write(json.dumps(data, ensure_ascii=False) + '\n')
                    