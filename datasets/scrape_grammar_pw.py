import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator
import pandas as pd
import time

def scrape_jlpt_grammar_playwright(level='n5'):
    url = f"https://jlptsensei.com/jlpt-{level}-grammar-list/"
    print(f"Bắt đầu crawl dữ liệu {level.upper()} từ {url} bằng Playwright...")
    
    grammar_data = []
    translator = GoogleTranslator(source='en', target='vi')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Navigate and wait for the page to load
        try:
            page.goto(url, wait_until="networkidle", timeout=60000)
            time.sleep(2) # Thêm chút delay cho an toàn
            html = page.content()
        except Exception as e:
            print(f"Lỗi khi load trang: {e}")
            browser.close()
            return []

        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table', {'id': 'jlpt-grammar-table'})
        
        if not table:
            print("Không tìm thấy bảng ngữ pháp trên trang (Có thể vẫn bị chặn).")
            browser.close()
            return []

        rows = table.find('tbody').find_all('tr')
        
        # Chỉ crawl thử 20 cấu trúc đầu tiên
        limit = min(20, len(rows))
        for i, row in enumerate(rows[:limit]):
            cols = row.find_all('td')
            if len(cols) >= 4:
                grammar_pattern = cols[1].text.strip()
                meaning_en = cols[3].text.strip()
                
                try:
                    meaning_vi = translator.translate(meaning_en)
                    if not meaning_vi: meaning_vi = meaning_en
                except Exception as e:
                    meaning_vi = meaning_en
                    
                grammar_data.append({
                    'level': level.upper(),
                    'grammar_pattern': grammar_pattern,
                    'meaning_en': meaning_en,
                    'meaning_vi': meaning_vi
                })
                print(f"Đã cào: {grammar_pattern} -> {meaning_vi}")

        browser.close()
    return grammar_data

if __name__ == "__main__":
    n5_data = scrape_jlpt_grammar_playwright('n5')
    if n5_data:
        df = pd.DataFrame(n5_data)
        csv_path = "JLPT_Grammar_Playwright.csv"
        df.to_csv(csv_path, index=False, encoding='utf-8-sig')
        print(f"\n✅ Đã lưu {len(n5_data)} cấu trúc ngữ pháp vào {csv_path}")
    else:
        print("Crawl thất bại.")
