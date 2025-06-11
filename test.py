# debug_wells_fargo_extraction.py
import sys
import os
from src.services.statement_parser import StatementParser
from src.services.pdf_processor import PDFProcessor

def test_wells_fargo_extraction(pdf_path):
    """Test Wells Fargo extraction step by step"""
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF file not found: {pdf_path}")
        return
    
    print(f"🔍 Testing Wells Fargo extraction on: {pdf_path}")
    print("=" * 80)
    
    # Step 1: Extract text from PDF
    print("📄 Step 1: Extracting text from PDF...")
    try:
        pdf_processor = PDFProcessor()
        extracted_text, confidence, relevant_page, total_pages = pdf_processor.extract_with_page_detection(pdf_path)
        
        print(f"   ✅ Text extraction successful")
        print(f"   📊 Confidence: {confidence:.2f}")
        print(f"   📄 Relevant page: {relevant_page}")
        print(f"   📚 Total pages: {total_pages}")
        print(f"   📝 Text length: {len(extracted_text)} characters")
        
        # Show first 500 characters
        print(f"\n📖 First 500 characters of extracted text:")
        print("-" * 50)
        print(extracted_text[:500])
        print("-" * 50)
        
    except Exception as e:
        print(f"   ❌ PDF extraction failed: {e}")
        return
    
    # Step 2: Test institution detection
    print(f"\n🏦 Step 2: Testing institution detection...")
    try:
        parser = StatementParser()
        detected_institution = parser._detect_institution(extracted_text)
        print(f"   ✅ Detected institution: {detected_institution}")
        
        if detected_institution != 'wells_fargo':
            print(f"   ⚠️  Expected 'wells_fargo', got '{detected_institution}'")
            print(f"   🔍 Checking for Wells Fargo keywords...")
            
            wells_fargo_keywords = [
                'wells fargo', 'wellsfargo', 'wells fargo bank',
                'wells fargo combined statement', 'wells fargo checking'
            ]
            
            text_lower = extracted_text.lower()
            for keyword in wells_fargo_keywords:
                if keyword in text_lower:
                    print(f"      ✅ Found keyword: '{keyword}'")
                else:
                    print(f"      ❌ Missing keyword: '{keyword}'")
        
    except Exception as e:
        print(f"   ❌ Institution detection failed: {e}")
        return
    
    # Step 3: Test Wells Fargo specific extraction
    print(f"\n💰 Step 3: Testing Wells Fargo data extraction...")
    try:
        statement_data = parser._extract_wells_fargo_bank(extracted_text)
        
        print(f"   Account name: {statement_data.account_name}")
        print(f"   Account number: {statement_data.account_number}")
        print(f"   Statement month: {statement_data.statement_month}")
        print(f"   Statement date: {statement_data.statement_date}")
        print(f"   Beginning balance: {statement_data.beginning_balance}")
        print(f"   Ending balance: {statement_data.ending_balance}")
        print(f"   Deposits: {statement_data.deposits_additions}")
        print(f"   Withdrawals: {statement_data.withdrawals_subtractions}")
        print(f"   Confidence score: {statement_data.confidence_score}")
        
        # Test specific patterns manually
        print(f"\n🔍 Step 4: Manual pattern testing...")
        
        # Date patterns
        import re
        date_patterns = [
            r'(\w+\s+\d{1,2},\s+\d{4})',  # "May 31, 2025"
            r'Statement\s+Period:?\s*(\d{1,2}/\d{1,2}/\d{4})\s*-\s*(\d{1,2}/\d{1,2}/\d{4})',
            r'For\s+the\s+period\s+(\w+\s+\d{1,2})\s*-\s*(\w+\s+\d{1,2},\s+\d{4})'
        ]
        
        print("   Testing date patterns:")
        for i, pattern in enumerate(date_patterns):
            matches = re.findall(pattern, extracted_text, re.IGNORECASE)
            if matches:
                print(f"      Pattern {i+1}: ✅ Found: {matches[:3]}")  # Show first 3 matches
            else:
                print(f"      Pattern {i+1}: ❌ No matches")
        
        # Balance patterns
        balance_patterns = [
            r'Beginning\s+balance\s+on\s+\d{1,2}/\d{1,2}\s+\$?([\d,]+\.?\d*)',
            r'Ending\s+balance\s+on\s+\d{1,2}/\d{1,2}\s+\$?([\d,]+\.?\d*)',
            r'Previous\s+balance\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Current\s+balance\s*:?\s*\$?([\d,]+\.?\d*)'
        ]
        
        print("   Testing balance patterns:")
        for i, pattern in enumerate(balance_patterns):
            matches = re.findall(pattern, extracted_text, re.IGNORECASE)
            if matches:
                print(f"      Pattern {i+1}: ✅ Found: {matches[:3]}")
            else:
                print(f"      Pattern {i+1}: ❌ No matches")
        
        # Show relevant sections of text
        print(f"\n📋 Step 5: Searching for key sections...")
        
        key_terms = ['beginning balance', 'ending balance', 'deposits', 'withdrawals', 'statement period']
        
        for term in key_terms:
            lines_with_term = []
            for line in extracted_text.split('\n'):
                if term.lower() in line.lower():
                    lines_with_term.append(line.strip())
            
            if lines_with_term:
                print(f"   '{term}' found in {len(lines_with_term)} lines:")
                for line in lines_with_term[:3]:  # Show first 3 lines
                    print(f"      '{line}'")
            else:
                print(f"   '{term}': ❌ Not found")
        
    except Exception as e:
        print(f"   ❌ Wells Fargo extraction failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":    
    pdf_path = r"old_data/Wells Fargo Bank Statement.pdf"
    test_wells_fargo_extraction(pdf_path)