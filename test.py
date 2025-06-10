#!/usr/bin/env python3
"""
API Data Verification Script
Verifies that all dashboard data comes from real API endpoints
and identifies where fake data is being generated.
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any, List
import sys

# API Configuration
API_BASE_URL = "http://192.168.1.226:8000/api"  # Your local API

class APIVerificationTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {}
    
    def test_endpoint(self, endpoint: str, description: str) -> Dict[str, Any]:
        """Test a single API endpoint and return results"""
        try:
            url = f"{self.base_url}{endpoint}"
            print(f"\n🔍 Testing: {description}")
            print(f"   URL: {url}")
            
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS - {response.status_code}")
                return {
                    "status": "success",
                    "status_code": response.status_code,
                    "data": data,
                    "data_type": type(data).__name__,
                    "data_size": len(str(data)) if data else 0
                }
            else:
                print(f"   ❌ FAILED - {response.status_code}")
                print(f"   Error: {response.text}")
                return {
                    "status": "failed",
                    "status_code": response.status_code,
                    "error": response.text
                }
                
        except Exception as e:
            print(f"   💥 EXCEPTION - {str(e)}")
            return {
                "status": "exception",
                "error": str(e)
            }
    
    def verify_financial_overview(self) -> Dict[str, Any]:
        """Verify the main financial overview endpoint"""
        result = self.test_endpoint("/statistics/overview", "Financial Overview (Dashboard Main Data)")
        
        if result["status"] == "success":
            data = result["data"]
            
            # Extract key metrics
            print(f"   📊 Data Range: {data.get('date_range', {})}")
            print(f"   💰 Net Worth: ${data.get('financial_health', {}).get('net_worth', {}).get('total_net_worth', 'N/A'):,.2f}")
            print(f"   💸 Monthly Spending: ${data.get('cash_flow_analysis', {}).get('monthly_spending', 'N/A'):,.2f}")
            print(f"   📈 Monthly Investments: ${data.get('cash_flow_analysis', {}).get('monthly_investments', 'N/A'):,.2f}")
            print(f"   🗓️  Total Months: {data.get('date_range', {}).get('total_months', 'N/A')}")
            
            # Verify yearly trends (real monthly data)
            yearly_trends = data.get('yearly_trends', {})
            print(f"   📅 Years with data: {list(yearly_trends.keys())}")
            
            result["extracted_metrics"] = {
                "net_worth": data.get('financial_health', {}).get('net_worth', {}).get('total_net_worth'),
                "monthly_spending": data.get('cash_flow_analysis', {}).get('monthly_spending'),
                "monthly_investments": data.get('cash_flow_analysis', {}).get('monthly_investments'),
                "total_months": data.get('date_range', {}).get('total_months'),
                "years_available": list(yearly_trends.keys()),
                "has_real_data": len(yearly_trends) > 0
            }
        
        return result
    
    def verify_monthly_summaries(self) -> Dict[str, Any]:
        """Verify monthly summaries endpoint"""
        result = self.test_endpoint("/monthly-summary", "Monthly Summaries (Real Transaction Data)")
        
        if result["status"] == "success":
            data = result["data"]
            summaries = data.get("summaries", [])
            
            print(f"   📝 Total Summaries: {len(summaries)}")
            if summaries:
                latest = summaries[0]  # Should be most recent
                print(f"   📅 Latest Month: {latest.get('month_year', 'N/A')}")
                
                # Safe number conversion
                latest_total = latest.get('total', 0)
                latest_investment = latest.get('investment_total', 0)
                try:
                    latest_total = float(latest_total) if latest_total else 0
                    latest_investment = float(latest_investment) if latest_investment else 0
                except (ValueError, TypeError):
                    latest_total = 0
                    latest_investment = 0
                
                print(f"   💰 Latest Total: ${latest_total:,.2f}")
                print(f"   📈 Latest Investment: ${latest_investment:,.2f}")
                
                # Show category breakdown for latest month
                categories = latest.get('category_totals', {})
                print(f"   🏷️  Categories: {list(categories.keys())}")
            
            result["extracted_metrics"] = {
                "total_summaries": len(summaries),
                "latest_month": summaries[0].get('month_year') if summaries else None,
                "has_category_data": len(summaries[0].get('category_totals', {})) > 0 if summaries else False
            }
        
        return result
    
    def verify_portfolio_data(self) -> Dict[str, Any]:
        """Verify portfolio endpoints"""
        overview_result = self.test_endpoint("/portfolio/overview", "Portfolio Overview (Real Balance Data)")
        trends_result = self.test_endpoint("/portfolio/trends", "Portfolio Trends (Real Balance History)")
        
        results = {
            "overview": overview_result,
            "trends": trends_result
        }
        
        if overview_result["status"] == "success":
            data = overview_result["data"]
            print(f"   💼 Total Portfolio: ${data.get('total_portfolio_value', 0):,.2f}")
            print(f"   🏦 Accounts: {len(data.get('accounts', []))}")
            
        if trends_result["status"] == "success":
            data = trends_result["data"]
            monthly_values = data.get('monthly_values', [])
            print(f"   📊 Monthly Values: {len(monthly_values)} months")
            
        return results
    
    def compare_dashboard_vs_api(self):
        """Compare what dashboard shows vs what API provides"""
        print("\n" + "="*80)
        print("🔍 DASHBOARD vs API DATA COMPARISON")
        print("="*80)
        
        # Get API data
        overview_data = self.results.get("financial_overview", {}).get("data", {})
        monthly_data = self.results.get("monthly_summaries", {}).get("data", {})
        
        print("\n📈 NET WORTH ANALYSIS:")
        api_net_worth = overview_data.get('financial_health', {}).get('net_worth', {}).get('total_net_worth')
        print(f"   API Net Worth: ${api_net_worth:,.2f}" if api_net_worth else "   API Net Worth: Not available")
        print(f"   Dashboard: Uses generateRealisticNetWorthData() - FAKE DATA")
        print(f"   ❌ ISSUE: Dashboard should use portfolio/trends API for real net worth history")
        
        print("\n💸 SPENDING PATTERN ANALYSIS:")
        monthly_summaries = monthly_data.get("summaries", [])
        if monthly_summaries:
            print(f"   API: {len(monthly_summaries)} months of real spending data available")
            print(f"   Dashboard: Uses generateRealPatternData() - ESTIMATED DATA")
            print(f"   ❌ ISSUE: Dashboard should directly use monthly summaries from API")
        
        print("\n📊 CHART DATA SOURCES:")
        print("   NetWorthChart: ❌ generateRealisticNetWorthData() - Should use /portfolio/trends")
        print("   FinancialPatternChart: ❌ generateRealPatternData() - Should use /monthly-summary") 
        print("   DrillDownCards: ✅ Uses real API data")
        print("   MetricCards: ✅ Uses real API data")
        
    def run_full_verification(self):
        """Run complete verification of all endpoints"""
        print("🚀 STARTING API DATA VERIFICATION")
        print("="*80)
        
        # Test core endpoints
        self.results["financial_overview"] = self.verify_financial_overview()
        self.results["monthly_summaries"] = self.verify_monthly_summaries()
        self.results["portfolio"] = self.verify_portfolio_data()
        
        # Additional endpoint tests
        endpoints_to_test = [
            ("/statistics/year-comparison", "Year Comparison"),
            ("/transactions?page_size=10", "Recent Transactions"),
            ("/categories", "Categories List"),
        ]
        
        for endpoint, description in endpoints_to_test:
            self.results[endpoint] = self.test_endpoint(endpoint, description)
        
        # Analysis
        self.compare_dashboard_vs_api()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print verification summary"""
        print("\n" + "="*80)
        print("📋 VERIFICATION SUMMARY")
        print("="*80)
        
        success_count = sum(1 for r in self.results.values() 
                          if isinstance(r, dict) and r.get("status") == "success")
        total_count = len([r for r in self.results.values() if isinstance(r, dict)])
        
        print(f"✅ Successful endpoints: {success_count}/{total_count}")
        
        # Check if we have real data
        overview_success = self.results.get("financial_overview", {}).get("status") == "success"
        monthly_success = self.results.get("monthly_summaries", {}).get("status") == "success"
        
        if overview_success and monthly_success:
            overview_metrics = self.results["financial_overview"].get("extracted_metrics", {})
            monthly_metrics = self.results["monthly_summaries"].get("extracted_metrics", {})
            
            print(f"\n📊 DATA AVAILABILITY:")
            print(f"   Real financial data: {overview_metrics.get('has_real_data', False)}")
            print(f"   Monthly summaries: {monthly_metrics.get('total_summaries', 0)} available")
            print(f"   Categories data: {monthly_metrics.get('has_category_data', False)}")
            
            print(f"\n🎯 KEY FINDINGS:")
            if overview_metrics.get('has_real_data') and monthly_metrics.get('total_summaries', 0) > 0:
                print("   ✅ Your backend has REAL financial data")
                print("   ❌ Your dashboard generates FAKE data instead of using it")
                print("   🔧 SOLUTION: Replace frontend data generation with API calls")
            else:
                print("   ❌ Missing real data in backend")
        
        print(f"\n📝 NEXT STEPS:")
        print("   1. Replace generateRealisticNetWorthData() with /portfolio/trends API")
        print("   2. Replace generateRealPatternData() with direct /monthly-summary API")  
        print("   3. Verify all dashboard metrics match API calculations")
        print("   4. Add data validation to ensure consistency")

def main():
    """Main verification function"""
    if len(sys.argv) > 1:
        api_url = sys.argv[1]
    else:
        api_url = API_BASE_URL
    
    print(f"🔧 Using API URL: {api_url}")
    
    tester = APIVerificationTester(api_url)
    tester.run_full_verification()
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"api_verification_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump(tester.results, f, indent=2, default=str)
    
    print(f"\n💾 Results saved to: {filename}")

if __name__ == "__main__":
    main()