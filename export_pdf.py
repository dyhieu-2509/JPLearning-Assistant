import markdown
from playwright.sync_api import sync_playwright

def export_to_pdf(md_path, pdf_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    # Convert Markdown to HTML
    html_content = markdown.markdown(md_text, extensions=['extra'])
    
    # Wrap in basic HTML structure with some styling
    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; }}
            h1, h2, h3 {{ color: #333; }}
            h1 {{ text-align: center; }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content(full_html)
        page.pdf(path=pdf_path, format="A4", margin={"top": "20px", "bottom": "20px", "left": "20px", "right": "20px"})
        browser.close()

if __name__ == "__main__":
    export_to_pdf("Thesis_Proposal_BuiDuyHieu.md", "Thesis_Proposal_BuiDuyHieu.pdf")
    print("PDF Exported Successfully!")
