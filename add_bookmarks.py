from PyPDF2 import PdfReader, PdfWriter

def add_bookmarks(input_pdf, output_pdf):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    # Dictionary to hold the page number for each heading
    # Initialize with default values in case text extraction fails
    headings = {
        "Contents": 1,
        "1. Introduction and Background": 2,
        "1.1. Problem Description": 2,
        "1.2. Research Objectives": 2,
        "1.3. Scope of the Project": 2,
        "2. Proposed Solution": 3,
        "2.1. Solution Description": 3,
        "2.2. Software Architecture": 3,
        "2.3. Technology Stack": 3,
        "3. Implementation Plan": 3,
        "3.1. Main Development Stages": 3,
        "3.2. Expected Schedule": 3,
        "3.3. Feasibility Assessment": 3,
        "4. Expected Results": 4,
        "5. Evaluation Plan": 4,
        "6. References": 4
    }

    # Try to find exact page numbers by searching text
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            for heading in headings.keys():
                # Check if heading exists in the page (simple string match)
                # Since contents page also has these strings, we skip page 1 (Contents) for chapter headings
                if heading in text:
                    if heading != "Contents" and "1. Introduction and Background" in text and i == 1:
                        # Skip the TOC page itself from being marked as the destination for chapters
                        pass
                    else:
                        headings[heading] = i

    # Add bookmarks to the writer
    # TOC
    writer.add_outline_item("Contents", headings["Contents"])
    
    # Chapter 1
    ch1 = writer.add_outline_item("1. Introduction and Background", headings["1. Introduction and Background"])
    writer.add_outline_item("1.1. Problem Description", headings["1.1. Problem Description"], parent=ch1)
    writer.add_outline_item("1.2. Research Objectives", headings["1.2. Research Objectives"], parent=ch1)
    writer.add_outline_item("1.3. Scope of the Project", headings["1.3. Scope of the Project"], parent=ch1)
    
    # Chapter 2
    ch2 = writer.add_outline_item("2. Proposed Solution", headings["2. Proposed Solution"])
    writer.add_outline_item("2.1. Solution Description", headings["2.1. Solution Description"], parent=ch2)
    writer.add_outline_item("2.2. Software Architecture", headings["2.2. Software Architecture"], parent=ch2)
    writer.add_outline_item("2.3. Technology Stack", headings["2.3. Technology Stack"], parent=ch2)

    # Chapter 3
    ch3 = writer.add_outline_item("3. Implementation Plan", headings["3. Implementation Plan"])
    writer.add_outline_item("3.1. Main Development Stages", headings["3.1. Main Development Stages"], parent=ch3)
    writer.add_outline_item("3.2. Expected Schedule", headings["3.2. Expected Schedule"], parent=ch3)
    writer.add_outline_item("3.3. Feasibility Assessment", headings["3.3. Feasibility Assessment"], parent=ch3)

    # Chapter 4, 5, 6
    writer.add_outline_item("4. Expected Results", headings["4. Expected Results"])
    writer.add_outline_item("5. Evaluation Plan", headings["5. Evaluation Plan"])
    writer.add_outline_item("6. References", headings["6. References"])

    with open(output_pdf, "wb") as fp:
        writer.write(fp)

if __name__ == "__main__":
    import os
    import shutil
    
    input_file = "Thesis_Proposal_BuiDuyHieu.pdf"
    output_file = "Thesis_Proposal_BuiDuyHieu_Outlined.pdf"
    
    add_bookmarks(input_file, output_file)
    
    # Replace original with outlined version
    shutil.move(output_file, input_file)
    print("Bookmarks added successfully!")
