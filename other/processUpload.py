# ! 把原本的原始內容按照格式轉換成 processed
 
import os
import json

uploads_files_dir = './src/server/uploads/files'
uploads_processed_dir = './src/server/uploads/processed'

field_names = [
    "精神賠償", "修車費用", "醫療費用", "看護費用", "看護天數", "看護價格", "交通費用", "財產損失", 
    "營業損失", "每日營業收入", "營業損失天數", "工作損失", "每日工作損失", "工作損失天數", 
    "訴訟費用", "事故日期", "出廠日期", "耐用年數", "零件", "材料", "工資", "鈑金", "塗裝", 
    "烤漆", "折舊方法", "被告肇責", "傷勢", "其他", "備註"
]

for file_name in os.listdir(uploads_files_dir):
    if file_name.endswith(".txt"):
        file_path = os.path.join(uploads_files_dir, file_name)
        
        write_content = []
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                
                data = json.loads(line)
                
                # @ 每一個都加入空字串
                processed = []
                for name in field_names:
                    field_dict = {
                        "name": name,
                        "value": "",
                        "the_surrounding_words": "",
                        "regular_expression_match": "",
                        "regular_expression_formula": "",
                        "gpt_value": ""
                    }
                    processed.append(field_dict)
            
                data['processed'] = processed
                write_content.append(data)
        
        # @ 寫入到新的目錄中
        processed_file_path = os.path.join(uploads_processed_dir, file_name)
        with open(processed_file_path, 'w', encoding='utf-8') as processed_file:
            for item in write_content:
                processed_file.write(json.dumps(item, ensure_ascii=False))
                processed_file.write('\n')