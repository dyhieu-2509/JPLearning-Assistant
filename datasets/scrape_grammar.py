import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator
import pandas as pd
import time

def scrape_jlpt_grammar_all():
    translator = GoogleTranslator(source='en', target='vi')
    all_grammar_data = []
    
    levels = ['n5', 'n4', 'n3', 'n2', 'n1']
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    for level in levels:
        page_num = 1
        while True:
            if page_num == 1:
                url = f"https://jlptsensei.com/jlpt-{level}-grammar-list/"
            else:
                url = f"https://jlptsensei.com/jlpt-{level}-grammar-list/page/{page_num}/"
                
            print(f"Đang crawl {level.upper()} - Trang {page_num} ({url})...")
            
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Hết dữ liệu ở {level.upper()} (hoặc lỗi {response.status_code}). Chuyển cấp độ.")
                break

            soup = BeautifulSoup(response.content, 'html.parser')
            table = soup.find('table', {'id': 'jl-grammar'})
            
            if not table:
                print("Không tìm thấy bảng. Chuyển cấp độ.")
                break

            rows = table.find('tbody').find_all('tr')
            if not rows:
                break
                
            count = 0
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 4:
                    # Tách dữ liệu cẩn thận hơn để tránh dính nội dung HTML rác
                    grammar_pattern = cols[1].find('a').text.strip() if cols[1].find('a') else cols[1].text.strip()
                    meaning_en = cols[3].text.strip()
                    
                    try:
                        meaning_vi = translator.translate(meaning_en)
                        if not meaning_vi: meaning_vi = meaning_en
                    except Exception:
                        meaning_vi = meaning_en
                        
                    all_grammar_data.append({
                        'level': level.upper(),
                        'grammar_pattern': grammar_pattern,
                        'meaning_en': meaning_en,
                        'meaning_vi': meaning_vi
                    })
                    count += 1
            
            print(f"  -> Cào được {count} cấu trúc.")
            page_num += 1
            time.sleep(1) # Tránh bị block

    return all_grammar_data

if __name__ == "__main__":
    print("Bắt đầu cào toàn bộ dữ liệu ngữ pháp N5 đến N1...")
    data = scrape_jlpt_grammar_all()
    if data:
        df = pd.DataFrame(data)
        csv_path = "JLPT_Grammar_Full.csv"
        df.to_csv(csv_path, index=False, encoding='utf-8-sig')
        print(f"\n✅ Đã lưu TỔNG CỘNG {len(data)} cấu trúc ngữ pháp vào {csv_path}")
    else:
        print("Crawl thất bại hoặc không lấy được dữ liệu.")
