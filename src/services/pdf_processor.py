# src/services/pdf_processor.py

"""
PDF Processing Service for extracting text from financial statements
Uses multiple extraction methods with fallback hierarchy
"""

import os
import tempfile
import logging
from typing import Tuple, Optional, Dict
from datetime import date
import re

try:
    import PyPDF2
    import pdfplumber
    import pytesseract
    from PIL import Image
except ImportError as e:
    missing_lib = str(e).split("'")[1]
    raise ImportError(f"Missing dependency: {missing_lib}. Run: pip install {missing_lib}")

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False
    print("Warning: PyMuPDF not available. Page extraction will be limited.")

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

        self.financial_keywords = [
            'balance', 'account', 'statement', 'total', 'ending',
            'portfolio', 'value', 'investment', 'brokerage',
            'roth', '401k', 'cash', 'schwab', 'wealthfront',
            'acorns', 'robinhood', 'fidelity', 'vanguard'
        ]
        
        # Currency pattern for scoring
        self.currency_pattern = r'\$[\d,]+\.?\d{0,2}'
        
        # Date patterns
        self.date_patterns = [
            r'\d{1,2}/\d{1,2}/\d{4}',
            r'\d{4}-\d{2}-\d{2}',
            r'[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}'
        ]

    def extract_wells_fargo_bank_statement(self, pdf_path: str) -> Tuple[str, float, int, int]:
        """
        Simple Wells Fargo fix - just force Page 2
        """
        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                
                # Your debug showed Page 2 has everything. Just use it.
                if total_pages >= 2:
                    page_2_text = pdf.pages[1].extract_text() or ""  # Page 2 = index 1
                    
                    # Validate it's the right page
                    if ('statement period activity summary' in page_2_text.lower() and 
                        'beginning balance on' in page_2_text.lower()):
                        
                        print(f"🎯 Using Page 2 (Wells Fargo summary page)")
                        
                        # Use the existing confidence calculation
                        confidence = self.calculate_confidence(page_2_text, "pdfplumber")
                        
                        return page_2_text, confidence, 2, total_pages
                
                # Fallback - use the original method
                print("⚠️ Page 2 validation failed, using original method")
                return self.extract_with_page_detection(pdf_path)
                
        except Exception as e:
            print(f"❌ Wells Fargo method failed: {e}")
            # Fallback to original method
            return self.extract_with_page_detection(pdf_path)

    def calculate_confidence(self, text: str, method: str) -> float:
        """Wrapper for the existing method"""
        return self._calculate_text_confidence(text, method)

    def extract_with_page_detection(self, pdf_file_path: str) -> Tuple[str, float, int, int]:
        """
        Extract text with page detection to find most relevant financial data
        FIXED: Analyze ALL pages + institution-aware scoring
        """
        if not os.path.exists(pdf_file_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_file_path}")
        
        logger.info(f"Processing PDF with page detection: {pdf_file_path}")
        
        try:
            # Get total page count first
            total_pages = self._get_page_count(pdf_file_path)
            logger.info(f"PDF has {total_pages} pages")
            
            # FIXED: Analyze ALL pages instead of just first 3
            page_scores = {}
            
            # Score each page for financial content
            for page_num in range(total_pages):
                try:
                    page_text, page_confidence = self._extract_page_text(pdf_file_path, page_num)
                    if page_text:
                        financial_score = self._score_page_for_financial_content(page_text)
                        total_score = (page_confidence * 0.3) + (financial_score * 0.7)  # Weight financial content higher
                        
                        page_scores[page_num + 1] = {
                            'text': page_text,
                            'confidence': page_confidence,
                            'financial_score': financial_score,
                            'total_score': total_score
                        }
                        
                        logger.info(f"Page {page_num + 1}: confidence={page_confidence:.2f}, financial_score={financial_score:.2f}, total={total_score:.2f}")
                    
                except Exception as e:
                    logger.warning(f"Error processing page {page_num + 1}: {str(e)}")
                    continue
            
            if not page_scores:
                logger.error("No pages could be processed")
                return "", 0.0, 1, total_pages
            
            # Find the best page
            best_page = max(page_scores.keys(), key=lambda k: page_scores[k]['total_score'])
            best_data = page_scores[best_page]
            
            logger.info(f"Best page: {best_page} with score {best_data['total_score']:.2f}")
            
            return (
                best_data['text'],
                best_data['confidence'], 
                best_page,
                total_pages
            )
            
        except Exception as e:
            logger.error(f"Error in page detection: {str(e)}")
            return "", 0.0, 1, 1

    def extract_single_page_pdf(self, source_pdf_path: str, page_number: int, output_path: str) -> bool:
        """
        Extract a single page from PDF and save as new PDF file
        
        Args:
            source_pdf_path: Path to source PDF
            page_number: Page number to extract (1-based)
            output_path: Where to save the single page PDF
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Extracting page {page_number} from {source_pdf_path}")
            
            if HAS_PYMUPDF:
                # Use PyMuPDF for better quality
                doc = fitz.open(source_pdf_path)
                
                if page_number > len(doc):
                    logger.error(f"Page {page_number} doesn't exist (PDF has {len(doc)} pages)")
                    return False
                
                # Create new document with just the target page
                new_doc = fitz.open()
                new_doc.insert_pdf(doc, from_page=page_number - 1, to_page=page_number - 1)
                
                # Ensure output directory exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                # Save the single page PDF
                new_doc.save(output_path)
                new_doc.close()
                doc.close()
                
                logger.info(f"Successfully extracted page {page_number} to {output_path}")
                return True
                
            else:
                # Fallback using PyPDF2
                with open(source_pdf_path, 'rb') as input_file:
                    pdf_reader = PyPDF2.PdfReader(input_file)
                    
                    if page_number > len(pdf_reader.pages):
                        logger.error(f"Page {page_number} doesn't exist (PDF has {len(pdf_reader.pages)} pages)")
                        return False
                    
                    pdf_writer = PyPDF2.PdfWriter()
                    pdf_writer.add_page(pdf_reader.pages[page_number - 1])
                    
                    # Ensure output directory exists
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    
                    with open(output_path, 'wb') as output_file:
                        pdf_writer.write(output_file)
                
                logger.info(f"Successfully extracted page {page_number} to {output_path}")
                return True
                
        except Exception as e:
            logger.error(f"Error extracting single page: {str(e)}")
            return False
    
    def _get_page_count(self, pdf_path: str) -> int:
        """Get total number of pages in PDF"""
        try:
            if HAS_PYMUPDF:
                doc = fitz.open(pdf_path)
                count = len(doc)
                doc.close()
                return count
            else:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    return len(pdf_reader.pages)
        except Exception as e:
            logger.error(f"Error getting page count: {str(e)}")
            return 1
    
    def _extract_page_text(self, pdf_path: str, page_number: int) -> Tuple[str, float]:
        """Extract text from a specific page (0-based index)"""
        try:
            # Try pdfplumber first (most reliable for structured text)
            with pdfplumber.open(pdf_path) as pdf:
                if page_number < len(pdf.pages):
                    page = pdf.pages[page_number]
                    text = page.extract_text()
                    if text and len(text.strip()) > 50:
                        confidence = self._calculate_text_confidence(text, "pdfplumber")
                        return text, confidence
            
            # Fallback to PyPDF2
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                if page_number < len(pdf_reader.pages):
                    page = pdf_reader.pages[page_number]
                    text = page.extract_text()
                    if text and len(text.strip()) > 50:
                        confidence = self._calculate_text_confidence(text, "pypdf2") * 0.8
                        return text, confidence
            
            logger.warning(f"Could not extract text from page {page_number + 1}")
            return "", 0.0
            
        except Exception as e:
            logger.error(f"Error extracting text from page {page_number + 1}: {str(e)}")
            return "", 0.0
    
    def _score_page_for_financial_content(self, text: str) -> float:
        """
        FIXED: Institution-aware scoring based on your screenshots
        """
        if not text:
            return 0.0
        
        text_lower = text.lower()
        score = 0.0
        
        # 1. HIGH-VALUE SUMMARY PAGE INDICATORS (what we want)
        summary_indicators = {
            'account summary': 2.0,              # Robinhood, Schwab
            'valuation at a glance': 2.0,        # Acorns
            'ending balance': 1.5,               # Multiple institutions
            'ending account value': 1.5,         # Schwab
            'portfolio value': 1.5,              # Robinhood
            'grand total': 1.5,                  # Acorns  
            'beginning balance': 1.0,            # Multiple
            'starting balance': 1.0,             # Wealthfront
            'beginning account value': 1.0,      # Schwab
            'activity by transaction type': 1.5, # ADP 401k (POSITIVE!)
            'total account value': 1.0
        }
        
        for keyword, points in summary_indicators.items():
            if keyword in text_lower:
                score += points
                logger.info(f"Found summary indicator '{keyword}': +{points}")
        
        # 2. INSTITUTION-SPECIFIC BONUSES
        # Acorns bonus
        if ("valuation at a glance" in text_lower and "ending balance" in text_lower and 
            "acorns securities" in text_lower):
            score += 1.0
            logger.info("Acorns summary page bonus: +1.0")
        
        # Robinhood bonus  
        if ("account summary" in text_lower and "portfolio value" in text_lower and
            "robinhood" in text_lower):
            score += 1.0
            logger.info("Robinhood summary page bonus: +1.0")
        
        # Schwab bonus
        if ("account summary" in text_lower and "ending account value" in text_lower and
            "schwab" in text_lower):
            score += 1.0  
            logger.info("Schwab summary page bonus: +1.0")
        
        # Wealthfront bonus
        if (("individual investment account" in text_lower or "individual cash account" in text_lower) and
            ("ending balance" in text_lower or "starting balance" in text_lower) and
            "wealthfront" in text_lower):
            score += 1.0
            logger.info("Wealthfront summary page bonus: +1.0")
        
        # ADP 401k bonus  
        if ("activity by transaction type" in text_lower and "ending balance" in text_lower):
            score += 1.0
            logger.info("ADP 401k summary page bonus: +1.0")
        
        # 3. TRANSACTION PAGE PENALTIES (but NOT for ADP!)
        transaction_penalties = {
            'transaction history': -1.0,
            'check deposits': -0.5,
            'check number': -0.5, 
            'description withdrawals': -0.5,
            'transaction history (continued)': -1.0
        }
        
        # EXCEPTION: Don't penalize ADP 401k pages that have the summary section
        is_adp_summary = "activity by transaction type" in text_lower and "ending balance" in text_lower
        
        if not is_adp_summary:  # Only apply penalties if NOT an ADP summary page
            for penalty_keyword, penalty_points in transaction_penalties.items():
                if penalty_keyword in text_lower:
                    score += penalty_points  # Adding negative points
                    logger.info(f"Found transaction indicator '{penalty_keyword}': {penalty_points}")
        
        # 4. CURRENCY AMOUNT VALIDATION (must have real dollar amounts)
        import re
        currency_patterns = re.findall(r'\$[\d,]+\.?\d{0,2}', text)
        
        # Filter for reasonable amounts (not $0.00, not single digits) 
        significant_amounts = []
        for amount_str in currency_patterns:
            try:
                # Remove $ and commas, convert to float
                amount_val = float(amount_str.replace('$', '').replace(',', ''))
                if amount_val > 10.0:  # Must be more than $10
                    significant_amounts.append(amount_val)
            except:
                continue
        
        # Bonus for having multiple significant dollar amounts
        if len(significant_amounts) >= 2:
            score += 0.5
            logger.info(f"Found {len(significant_amounts)} significant amounts: +0.5")
        elif len(significant_amounts) == 1:
            score += 0.2
        
        # 5. DATE PATTERN VALIDATION (should have proper dates)
        date_patterns = re.findall(r'\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}', text)
        if len(date_patterns) >= 1:
            score += 0.3
        
        # 6. ENSURE MINIMUM CONTENT DENSITY
        if len(text.strip()) < 100:
            score *= 0.5  # Penalize very short pages
        
        # 7. PREVENT NEGATIVE SCORES 
        final_score = max(score, 0.0)
        
        logger.info(f"Final page score: {final_score:.2f}")
        return final_score

    def _parse_currency_amount(self, currency_str: str) -> float:
        """Parse currency string to float for scoring"""
        try:
            cleaned = currency_str.replace('$', '').replace(',', '')
            return float(cleaned)
        except:
            return 0.0

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
            
            # Convert PDF to images
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