# src/services/pdf_processor.py

"""
PDF Processing Service for extracting text from financial statements
Uses multiple extraction methods with fallback hierarchy
"""

import os
import tempfile
import logging
from typing import Tuple, Optional
from decimal import Decimal
from datetime import date

try:
    import PyPDF2
    import pdfplumber
    import pytesseract
    from PIL import Image
except ImportError as e:
    missing_lib = str(e).split("'")[1]
    raise ImportError(f"Missing dependency: {missing_lib}. Run: pip install {missing_lib}")

# Try to import PyMuPDF (optional, for better OCR)
try:
    import fitz
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False
    print("Warning: PyMuPDF not available. OCR will use basic PDF to image conversion.")

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Service for extracting text from PDF files using multiple methods"""
    
    def __init__(self):
        """Initialize PDF processor with method priorities"""
        self.extraction_methods = [
            self._extract_with_pdfplumber,
            self._extract_with_pypdf2,
            self._extract_with_ocr
        ]
    
    def extract_text(self, pdf_file_path: str) -> Tuple[str, float]:
        """
        Extract text from PDF using best available method
        
        Args:
            pdf_file_path: Path to the PDF file
            
        Returns:
            Tuple of (extracted_text, confidence_score)
            confidence_score: 0.0-1.0, higher = more reliable
        """
        if not os.path.exists(pdf_file_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_file_path}")
        
        logger.info(f"Processing PDF: {pdf_file_path}")
        
        # Try each extraction method in order of reliability
        for method_name, method in zip(
            ["pdfplumber", "pypdf2", "ocr"], 
            self.extraction_methods
        ):
            try:
                logger.info(f"Attempting extraction with {method_name}")
                text, confidence = method(pdf_file_path)
                
                if text and len(text.strip()) > 50:  # Minimum viable text length
                    logger.info(f"Successfully extracted {len(text)} characters using {method_name}")
                    return text, confidence
                else:
                    logger.warning(f"{method_name} returned insufficient text ({len(text)} chars)")
                    
            except Exception as e:
                logger.warning(f"{method_name} extraction failed: {str(e)}")
                continue
        
        # If all methods fail
        logger.error("All extraction methods failed")
        return "", 0.0
    
    def _extract_with_pdfplumber(self, pdf_path: str) -> Tuple[str, float]:
        """
        Extract text using pdfplumber (best for structured PDFs)
        
        Returns:
            Tuple of (text, confidence_score)
        """
        try:
            text_parts = []
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- PAGE {page_num + 1} ---\n{page_text}\n")
            
            full_text = "\n".join(text_parts)
            
            # Calculate confidence based on text quality indicators
            confidence = self._calculate_text_confidence(full_text, method="pdfplumber")
            
            return full_text, confidence
            
        except Exception as e:
            logger.error(f"pdfplumber extraction error: {str(e)}")
            return "", 0.0
    
    def _extract_with_pypdf2(self, pdf_path: str) -> Tuple[str, float]:
        """
        Extract text using PyPDF2 (fallback method)
        
        Returns:
            Tuple of (text, confidence_score)
        """
        try:
            text_parts = []
            
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- PAGE {page_num + 1} ---\n{page_text}\n")
            
            full_text = "\n".join(text_parts)
            
            # PyPDF2 is less reliable, so lower base confidence
            confidence = self._calculate_text_confidence(full_text, method="pypdf2") * 0.8
            
            return full_text, confidence
            
        except Exception as e:
            logger.error(f"PyPDF2 extraction error: {str(e)}")
            return "", 0.0
    
    def _extract_with_ocr(self, pdf_path: str) -> Tuple[str, float]:
        """
        Extract text using OCR (last resort for image-based PDFs)
        
        Returns:
            Tuple of (text, confidence_score)
        """
        try:
            text_parts = []
            
            if HAS_PYMUPDF:
                # Use PyMuPDF for better PDF to image conversion
                pdf_document = fitz.open(pdf_path)
                
                for page_num in range(len(pdf_document)):
                    page = pdf_document.load_page(page_num)
                    
                    # Convert page to image
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x resolution for better OCR
                    img_data = pix.tobytes("png")
                    
                    # Save to temporary file for Tesseract
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_img:
                        temp_img.write(img_data)
                        temp_img_path = temp_img.name
                    
                    try:
                        # Run OCR on the image
                        ocr_text = pytesseract.image_to_string(
                            Image.open(temp_img_path),
                            config='--psm 6'  # Assume uniform block of text
                        )
                        
                        if ocr_text.strip():
                            text_parts.append(f"--- PAGE {page_num + 1} ---\n{ocr_text}\n")
                            
                    finally:
                        # Clean up temporary image
                        os.unlink(temp_img_path)
                
                pdf_document.close()
            else:
                # Fallback: Basic OCR without PyMuPDF
                logger.warning("PyMuPDF not available, OCR functionality limited")
                return "OCR requires PyMuPDF (pip install PyMuPDF)", 0.1
            
            full_text = "\n".join(text_parts)
            
            # OCR is least reliable, so lower confidence
            confidence = self._calculate_text_confidence(full_text, method="ocr") * 0.6
            
            return full_text, confidence
            
        except Exception as e:
            logger.error(f"OCR extraction error: {str(e)}")
            return "", 0.0
    
    def _calculate_text_confidence(self, text: str, method: str) -> float:
        """
        Calculate confidence score based on text quality indicators
        
        Args:
            text: Extracted text
            method: Extraction method used
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        if not text or len(text.strip()) < 10:
            return 0.0
        
        confidence_factors = []
        
        # Length factor (longer text usually better)
        length_score = min(len(text) / 1000, 1.0)  # Cap at 1000 chars
        confidence_factors.append(length_score)
        
        # Financial keywords present
        financial_keywords = [
            'balance', 'account', 'total', 'value', 'portfolio', 
            'investment', 'statement', 'period', '$', 'amount'
        ]
        
        keyword_count = sum(1 for keyword in financial_keywords if keyword.lower() in text.lower())
        keyword_score = min(keyword_count / len(financial_keywords), 1.0)
        confidence_factors.append(keyword_score)
        
        # Number/currency pattern detection
        import re
        currency_patterns = re.findall(r'\$[\d,]+\.?\d*', text)
        date_patterns = re.findall(r'\d{1,2}[/\-]\d{1,2}[/\-]\d{4}', text)
        
        pattern_score = min((len(currency_patterns) + len(date_patterns)) / 10, 1.0)
        confidence_factors.append(pattern_score)
        
        # Text coherence (not too many weird characters)
        weird_chars = sum(1 for char in text if not (char.isalnum() or char.isspace() or char in '.,/$%-()'))
        coherence_score = max(0, 1.0 - (weird_chars / len(text)))
        confidence_factors.append(coherence_score)
        
        # Calculate weighted average
        base_confidence = sum(confidence_factors) / len(confidence_factors)
        
        # Method-specific adjustments
        method_multipliers = {
            "pdfplumber": 1.0,    # Most reliable
            "pypdf2": 0.85,       # Good but sometimes misses formatting
            "ocr": 0.7            # Least reliable, prone to errors
        }
        
        final_confidence = base_confidence * method_multipliers.get(method, 0.5)
        
        return min(final_confidence, 1.0)  # Cap at 1.0
    
    def get_pdf_metadata(self, pdf_path: str) -> dict:
        """
        Extract metadata from PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dictionary with PDF metadata
        """
        try:
            with pdfplumber.open(pdf_path) as pdf:
                metadata = pdf.metadata or {}
                
                return {
                    "page_count": len(pdf.pages),
                    "title": metadata.get("Title", ""),
                    "author": metadata.get("Author", ""),
                    "subject": metadata.get("Subject", ""),
                    "creator": metadata.get("Creator", ""),
                    "producer": metadata.get("Producer", ""),
                    "creation_date": metadata.get("CreationDate", ""),
                    "modification_date": metadata.get("ModDate", ""),
                }
                
        except Exception as e:
            logger.error(f"Error extracting PDF metadata: {str(e)}")
            return {"page_count": 0, "error": str(e)}


# Convenience function for easy importing
def extract_text_from_pdf(pdf_path: str) -> Tuple[str, float]:
    """
    Convenience function to extract text from PDF
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        Tuple of (extracted_text, confidence_score)
    """
    processor = PDFProcessor()
    return processor.extract_text(pdf_path)