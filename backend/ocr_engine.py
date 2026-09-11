"""
ocr_engine.py — Image & PDF Extraction Engine
Uses PyMuPDF (fitz) to extract text and embedded images from PDFs.
Tesseract has been deprecated in favor of Gemini Vision API.
"""
import os
import io
import re

# -------------------------------------------------------
# PDF Processing: extract text + images
# -------------------------------------------------------
def process_pdf(file_content: bytes, doc_version_id: int, save_dir: str) -> tuple:
    """
    Process a PDF file using PyMuPDF (fitz):
    - Extract selectable text
    - Extract ALL embedded images flawlessly
    """
    try:
        import fitz  # PyMuPDF
        
        pdf = fitz.open(stream=file_content, filetype="pdf")
        all_text_parts = []
        saved_images = []

        for page_num in range(len(pdf)):
            page = pdf[page_num]
            
            # --- Step 1: Native Text Extraction ---
            page_text = page.get_text() or ""
            page_has_text = len(page_text.strip()) > 10
            
            if page_has_text:
                all_text_parts.append(page_text.strip())

            # --- Step 2: Extract embedded images ---
            image_list = page.get_images(full=True)
            
            for img_index, img_info in enumerate(image_list):
                try:
                    xref = img_info[0]
                    base_image = pdf.extract_image(xref)
                    img_bytes = base_image["image"]
                    ext = base_image["ext"]
                    
                    if ext not in ('jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'):
                        ext = 'png'

                    img_filename = f"docv{doc_version_id}_page{page_num + 1}_img{img_index + 1}.{ext}"
                    img_path = os.path.join(save_dir, img_filename)
                    with open(img_path, 'wb') as f:
                        f.write(img_bytes)
                    saved_images.append(img_filename)

                except Exception as img_err:
                    print(f"[Extractor] Image {img_index+1} on page {page_num+1} failed: {img_err}")

        pdf.close()
        return "\n\n".join(all_text_parts), saved_images

    except Exception as e:
        print(f"[Extractor] PDF processing error: {e}")
        return "", []


def is_image_file(filename: str) -> bool:
    """Return True if the file is a supported image format."""
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''
    return ext in ('jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 'gif', 'webp')


def is_pdf_file(filename: str) -> bool:
    return filename.lower().endswith('.pdf')

