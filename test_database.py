import pytesseract
import pdfplumber
import PyPDF2

print("Dependencies check:")
print(f"pytesseract: {pytesseract.__version__ if hasattr(pytesseract, '__version__') else 'installed'}")
print(f"pdfplumber: {pdfplumber.__version__}")
print(f"PyPDF2: {PyPDF2.__version__}")