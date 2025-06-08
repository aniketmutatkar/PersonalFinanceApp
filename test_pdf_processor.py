# test_all_pdfs.py
"""
Batch PDF testing script for OCR system
Tests all PDFs in old_data folder and generates detailed report
"""

import os
import json
import requests
from datetime import datetime
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000/api/portfolio"
PDF_FOLDER = "old_data"  # Adjust path as needed
OUTPUT_FILE = f"pdf_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

def test_pdf_file(pdf_path: str) -> dict:
    """Test a single PDF file and return results"""
    print(f"\n🧪 Testing: {os.path.basename(pdf_path)}")
    
    try:
        # Upload PDF to OCR endpoint
        with open(pdf_path, 'rb') as pdf_file:
            files = {'file': pdf_file}
            response = requests.post(
                f"{API_BASE_URL}/statements/upload",
                files=files,
                timeout=30
            )
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract key metrics
            confidence = result.get('confidence_score', 0)
            requires_review = result.get('requires_review', True)
            extracted_data = result.get('extracted_data', {})
            
            print(f"  ✅ Confidence: {confidence:.2f}")
            print(f"  📊 Institution: {extracted_data.get('institution', 'Unknown')}")
            print(f"  💰 Balance: ${extracted_data.get('ending_balance', 'Not found')}")
            print(f"  📅 Date: {extracted_data.get('statement_period_end', 'Not found')}")
            print(f"  🔍 Review Required: {requires_review}")
            
            return {
                "filename": os.path.basename(pdf_path),
                "status": "success",
                "confidence_score": confidence,
                "requires_review": requires_review,
                "extracted_data": extracted_data,
                "message": result.get('message', ''),
                "file_size_mb": round(os.path.getsize(pdf_path) / 1024 / 1024, 2)
            }
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            print(f"  ❌ Error: {error_msg}")
            return {
                "filename": os.path.basename(pdf_path),
                "status": "error",
                "error": error_msg,
                "file_size_mb": round(os.path.getsize(pdf_path) / 1024 / 1024, 2)
            }
            
    except Exception as e:
        error_msg = str(e)
        print(f"  ❌ Exception: {error_msg}")
        return {
            "filename": os.path.basename(pdf_path),
            "status": "exception",
            "error": error_msg,
            "file_size_mb": round(os.path.getsize(pdf_path) / 1024 / 1024, 2) if os.path.exists(pdf_path) else 0
        }

def generate_summary_report(results: list) -> dict:
    """Generate summary statistics from test results"""
    total_files = len(results)
    successful = len([r for r in results if r['status'] == 'success'])
    failed = total_files - successful
    
    if successful > 0:
        successful_results = [r for r in results if r['status'] == 'success']
        avg_confidence = sum(r['confidence_score'] for r in successful_results) / successful
        high_confidence = len([r for r in successful_results if r['confidence_score'] >= 0.8])
        med_confidence = len([r for r in successful_results if 0.6 <= r['confidence_score'] < 0.8])
        low_confidence = len([r for r in successful_results if r['confidence_score'] < 0.6])
        
        # Institution breakdown
        institutions = {}
        for r in successful_results:
            inst = r['extracted_data'].get('institution', 'unknown')
            if inst not in institutions:
                institutions[inst] = {'count': 0, 'avg_confidence': 0, 'confidences': []}
            institutions[inst]['count'] += 1
            institutions[inst]['confidences'].append(r['confidence_score'])
        
        # Calculate average confidence per institution
        for inst in institutions:
            confidences = institutions[inst]['confidences']
            institutions[inst]['avg_confidence'] = sum(confidences) / len(confidences)
            del institutions[inst]['confidences']  # Remove detailed list
    else:
        avg_confidence = 0
        high_confidence = med_confidence = low_confidence = 0
        institutions = {}
    
    return {
        "summary": {
            "total_files": total_files,
            "successful_extractions": successful,
            "failed_extractions": failed,
            "success_rate": f"{(successful/total_files*100):.1f}%" if total_files > 0 else "0%",
            "average_confidence": f"{avg_confidence:.2f}" if successful > 0 else "N/A"
        },
        "confidence_breakdown": {
            "high_confidence_80_plus": high_confidence,
            "medium_confidence_60_80": med_confidence,
            "low_confidence_below_60": low_confidence
        },
        "institution_breakdown": institutions
    }

def main():
    """Main testing function"""
    print("🔍 PDF OCR Batch Testing Script")
    print("=" * 50)
    
    # Check if API is running
    try:
        health_response = requests.get(f"{API_BASE_URL.replace('/portfolio', '')}/health", timeout=5)
        if health_response.status_code != 200:
            print("❌ API is not running. Start your backend with: python run_api.py")
            return
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to API. Make sure your backend is running on localhost:8000")
        return
    
    print("✅ API connection successful")
    
    # Find all PDF files
    pdf_folder = Path(PDF_FOLDER)
    if not pdf_folder.exists():
        print(f"❌ Folder '{PDF_FOLDER}' not found. Please adjust the PDF_FOLDER variable.")
        return
    
    pdf_files = list(pdf_folder.glob("*.pdf")) + list(pdf_folder.glob("*.PDF"))
    
    if not pdf_files:
        print(f"❌ No PDF files found in '{PDF_FOLDER}' folder.")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF file(s) to test")
    
    # Test each PDF
    results = []
    for pdf_path in pdf_files:
        result = test_pdf_file(str(pdf_path))
        results.append(result)
    
    # Generate summary
    summary = generate_summary_report(results)
    
    # Combine results with summary
    full_report = {
        "test_timestamp": datetime.now().isoformat(),
        "test_summary": summary,
        "detailed_results": results
    }
    
    # Save results to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(full_report, f, indent=2)
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 FINAL SUMMARY")
    print("=" * 50)
    print(f"📁 Total Files Tested: {summary['summary']['total_files']}")
    print(f"✅ Successful Extractions: {summary['summary']['successful_extractions']}")
    print(f"❌ Failed Extractions: {summary['summary']['failed_extractions']}")
    print(f"📈 Success Rate: {summary['summary']['success_rate']}")
    print(f"🎯 Average Confidence: {summary['summary']['average_confidence']}")
    
    print(f"\n🎯 Confidence Distribution:")
    print(f"  🟢 High (80%+): {summary['confidence_breakdown']['high_confidence_80_plus']} files")
    print(f"  🟡 Medium (60-80%): {summary['confidence_breakdown']['medium_confidence_60_80']} files") 
    print(f"  🔴 Low (<60%): {summary['confidence_breakdown']['low_confidence_below_60']} files")
    
    if summary['institution_breakdown']:
        print(f"\n🏛️ Institution Breakdown:")
        for inst, data in summary['institution_breakdown'].items():
            print(f"  📋 {inst.title()}: {data['count']} files (avg: {data['avg_confidence']:.2f})")
    
    print(f"\n💾 Detailed results saved to: {OUTPUT_FILE}")
    print("\n🎯 Next Steps:")
    print("  1. Review failed extractions and improve patterns")
    print("  2. Add institution-specific parsing for low-confidence results")
    print("  3. Test manual review workflow for medium-confidence files")

if __name__ == "__main__":
    main()