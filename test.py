# test_wells_fargo_fixed.py

"""
Comprehensive test script for Wells Fargo OCR implementation
Tests both page detection and pattern matching
"""

import os
import sys
import logging
from datetime import datetime
from decimal import Decimal

# Setup logging to see debug output
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Add your src directory to the path (adjust if needed)
sys.path.append('src')

from services.pdf_processor import PDFProcessor
from services.statement_parser import StatementParser

def test_wells_fargo_ocr(pdf_path: str):
    """
    Test the complete Wells Fargo OCR pipeline
    """
    print("=" * 80)
    print("🏦 WELLS FARGO OCR TEST - COMPREHENSIVE VALIDATION")
    print("=" * 80)
    
    if not os.path.exists(pdf_path):
        print(f"❌ ERROR: PDF file not found: {pdf_path}")
        return False
    
    # File info
    file_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    print(f"📄 PDF File: {os.path.basename(pdf_path)} ({file_size_mb:.2f} MB)")
    
    try:
        # Step 1: PDF Processing with enhanced page detection
        print("\n🔍 STEP 1: PDF PROCESSING & PAGE DETECTION")
        print("-" * 50)
        
        pdf_processor = PDFProcessor()
        
        # Test the Wells Fargo specific method
        extracted_text, extraction_confidence, relevant_page, total_pages = pdf_processor.extract_wells_fargo_bank_statement(pdf_path)
        
        print(f"📊 OCR Results:")
        print(f"   • Total Pages: {total_pages}")
        print(f"   • Selected Page: {relevant_page}")
        print(f"   • Extraction Confidence: {extraction_confidence:.2%}")
        print(f"   • Text Length: {len(extracted_text):,} characters")
        
        if extraction_confidence < 0.3:
            print(f"⚠️  WARNING: Low extraction confidence ({extraction_confidence:.1%})")
        
        # Show a sample of extracted text
        print(f"\n📝 Text Sample (first 300 chars):")
        print("-" * 30)
        print(f"'{extracted_text[:300]}...'")
        
        # Step 2: Statement Parsing
        print("\n🔍 STEP 2: STATEMENT PARSING")
        print("-" * 50)
        
        parser = StatementParser()
        statement_data = parser.parse_statement(extracted_text)
        
        # Detailed results
        print(f"🏦 Institution Detection:")
        print(f"   • Detected: {statement_data.institution}")
        print(f"   • Confidence: {statement_data.confidence_score:.2%}")
        
        print(f"\n💰 Balance Extraction:")
        success_count = 0
        total_extractions = 6
        
        # Check each extraction
        extractions = [
            ("Beginning Balance", statement_data.beginning_balance),
            ("Ending Balance", statement_data.ending_balance),
            ("Account Number", statement_data.account_number),
            ("Account Type", statement_data.account_type),
            ("Statement Start", statement_data.statement_period_start),
            ("Statement End", statement_data.statement_period_end),
        ]
        
        for name, value in extractions:
            if value:
                print(f"   ✅ {name}: {value}")
                success_count += 1
            else:
                print(f"   ❌ {name}: NOT FOUND")
        
        # Overall success rate
        success_rate = (success_count / total_extractions) * 100
        print(f"\n📊 Extraction Success Rate: {success_rate:.1f}% ({success_count}/{total_extractions})")
        
        # Step 3: Detailed Analysis
        print(f"\n🔍 STEP 3: DETAILED ANALYSIS")
        print("-" * 50)
        
        print(f"🗒️  Extraction Notes ({len(statement_data.extraction_notes)} items):")
        for i, note in enumerate(statement_data.extraction_notes, 1):
            print(f"   {i}. {note}")
        
        # Step 4: Validation & Recommendations
        print(f"\n🎯 STEP 4: VALIDATION & RECOMMENDATIONS")
        print("-" * 50)
        
        # Critical validations
        critical_missing = []
        if not statement_data.ending_balance:
            critical_missing.append("Ending Balance")
        if not statement_data.statement_period_end:
            critical_missing.append("Statement Date")
        if not statement_data.institution or statement_data.institution == 'unknown':
            critical_missing.append("Institution Detection")
        
        if critical_missing:
            print(f"🚨 CRITICAL ISSUES:")
            for issue in critical_missing:
                print(f"   • Missing: {issue}")
        else:
            print(f"✅ All critical data extracted successfully!")
        
        # Pattern matching analysis
        print(f"\n🔍 Pattern Matching Analysis:")
        wells_fargo_indicators = [
            'wells fargo combined statement',
            'statement period activity summary',
            'beginning balance on',
            'ending balance on',
            'deposits/additions',
            'withdrawals/subtractions'
        ]
        
        found_indicators = []
        text_lower = extracted_text.lower()
        for indicator in wells_fargo_indicators:
            if indicator in text_lower:
                found_indicators.append(indicator)
        
        print(f"   • Wells Fargo Indicators Found: {len(found_indicators)}/{len(wells_fargo_indicators)}")
        for indicator in found_indicators:
            print(f"     ✅ '{indicator}'")
        
        # Page type analysis
        transaction_indicators = ['transaction history', 'check deposits', 'check number']
        summary_indicators = ['activity summary', 'beginning balance', 'ending balance']
        
        transaction_count = sum(1 for ind in transaction_indicators if ind in text_lower)
        summary_count = sum(1 for ind in summary_indicators if ind in text_lower)
        
        print(f"\n📄 Page Type Analysis:")
        print(f"   • Summary Page Indicators: {summary_count}")
        print(f"   • Transaction Page Indicators: {transaction_count}")
        
        if summary_count > transaction_count:
            print(f"   ✅ Correctly detected SUMMARY page")
        else:
            print(f"   ⚠️  May have detected TRANSACTION page instead of summary")
        
        # Final verdict
        print(f"\n🏁 FINAL VERDICT")
        print("-" * 50)
        
        if success_rate >= 80:
            verdict = "🎉 EXCELLENT"
            color = "GREEN"
        elif success_rate >= 60:
            verdict = "👍 GOOD"
            color = "YELLOW"
        else:
            verdict = "❌ NEEDS WORK"
            color = "RED"
        
        print(f"Overall Result: {verdict}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Confidence: {statement_data.confidence_score:.2%}")
        
        # Recommendations
        if success_rate < 80:
            print(f"\n💡 RECOMMENDATIONS:")
            if not statement_data.ending_balance:
                print(f"   • Add more balance extraction patterns")
            if not statement_data.account_number:
                print(f"   • Improve account number detection")
            if summary_count <= transaction_count:
                print(f"   • Enhance page detection to prioritize summary pages")
        
        return success_rate >= 60  # Consider 60%+ a passing grade
        
    except Exception as e:
        print(f"❌ ERROR during processing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_specific_patterns(pdf_path: str):
    """
    Test specific regex patterns on the extracted text
    """
    print("\n" + "=" * 80)
    print("🧪 PATTERN TESTING - REGEX VALIDATION")
    print("=" * 80)
    
    try:
        # Extract text first
        pdf_processor = PDFProcessor()
        text, _, _, _ = pdf_processor.extract_wells_fargo_bank_statement(pdf_path)
        
        import re
        
        # Test individual patterns
        test_patterns = [
            ("Institution Detection", r'wells fargo combined statement', True),
            ("Account Number", r'(\d{8,12})', False),
            ("Beginning Balance", r'beginning balance on\s+\d{1,2}/\d{1,2}\s*\$?([\d,]+\.?\d*)', False),
            ("Ending Balance", r'ending balance on\s+\d{1,2}/\d{1,2}\s*\$?([\d,]+\.?\d*)', False),
            ("Statement Date", r'([A-Za-z]+\s+\d{1,2},\s*\d{4})\s+page\s+\d+\s+of\s+\d+', False),
            ("Deposits", r'deposits/additions\s+\$?([\d,]+\.?\d*)', False),
            ("Withdrawals", r'withdrawals/subtractions\s*-?\s*\$?([\d,]+\.?\d*)', False),
            ("Transaction Totals", r'totals\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)', False),
        ]
        
        print(f"Testing {len(test_patterns)} patterns on extracted text...")
        
        for pattern_name, pattern, case_sensitive in test_patterns:
            flags = 0 if case_sensitive else re.IGNORECASE
            matches = re.findall(pattern, text, flags)
            
            if matches:
                print(f"✅ {pattern_name}: {len(matches)} match(es)")
                for i, match in enumerate(matches[:3]):  # Show first 3 matches
                    print(f"    {i+1}. {match}")
                if len(matches) > 3:
                    print(f"    ... and {len(matches) - 3} more")
            else:
                print(f"❌ {pattern_name}: No matches")
        
    except Exception as e:
        print(f"❌ Error in pattern testing: {e}")

if __name__ == "__main__":
    # Replace with your actual PDF path
    PDF_PATH = r"old_data/Wells Fargo Bank Statement.pdf"  # Update this path
    
    # You can also pass the path as a command line argument
    if len(sys.argv) > 1:
        PDF_PATH = sys.argv[1]
    
    print(f"Testing with PDF: {PDF_PATH}")
    
    # Run comprehensive test
    success = test_wells_fargo_ocr(PDF_PATH)
    
    # Run pattern tests
    test_specific_patterns(PDF_PATH)
    
    # Final summary
    print("\n" + "=" * 80)
    print("🏁 TEST COMPLETE")
    print("=" * 80)
    
    if success:
        print("🎉 OVERALL: PASSING - OCR implementation working!")
    else:
        print("❌ OVERALL: FAILING - Needs debugging")
    
    print("\nNext steps:")
    print("1. Fix any failing patterns shown above")
    print("2. Test with different Wells Fargo statement formats")
    print("3. Add more specific patterns if needed")