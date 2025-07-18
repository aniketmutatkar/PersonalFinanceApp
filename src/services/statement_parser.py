# src/services/statement_parser.py
"""
Enhanced Statement Parser Service with institution-specific patterns
SECURITY UPDATE: Removed account number extraction to protect sensitive data
"""

import re
import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class StatementData:
    """
    Extracted statement data
    SECURITY UPDATE: Removed account_number field
    """
    institution: Optional[str] = None
    account_type: Optional[str] = None
    statement_period_start: Optional[date] = None
    statement_period_end: Optional[date] = None
    beginning_balance: Optional[Decimal] = None
    ending_balance: Optional[Decimal] = None
    confidence_score: float = 0.0
    extraction_notes: List[str] = None
    
    def __post_init__(self):
        if self.extraction_notes is None:
            self.extraction_notes = []


class StatementParser:
    """Enhanced parser with institution-specific patterns based on actual PDFs"""
    
    def __init__(self):
        """Initialize parser with institution-specific extraction methods"""
        self.institution_extractors = {
            'wells_fargo': self._extract_wells_fargo_bank,
            'adp': self._extract_adp_401k,
            'acorns': self._extract_acorns,
            'robinhood': self._extract_robinhood,
            'schwab': self._extract_schwab,
            'wealthfront': self._extract_wealthfront
        }
    
    def parse_statement(self, text: str) -> StatementData:
        """
        Parse statement text using institution-specific extractors
        
        Args:
            text: Raw text extracted from PDF
            
        Returns:
            StatementData with extracted information
        """
        logger.info(f"Parsing statement text ({len(text)} characters)")
        
        # Clean the text
        cleaned_text = self._clean_text(text)
        
        # Detect institution with improved patterns
        institution = self._detect_institution(cleaned_text)
        logger.info(f"Detected institution: {institution}")
        
        if institution not in self.institution_extractors:
            logger.warning(f"Unknown institution: {institution}")
            return StatementData(
                institution=institution,
                confidence_score=0.1,
                extraction_notes=[f"Unknown institution: {institution}"]
            )
        
        # Use institution-specific extractor
        statement_data = self.institution_extractors[institution](cleaned_text)
        statement_data.institution = institution
        
        # Calculate confidence based on successful extractions
        statement_data.confidence_score = self._calculate_confidence(statement_data, cleaned_text)
        
        logger.info(f"Parsing complete. Confidence: {statement_data.confidence_score:.2f}")
        return statement_data
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text for better pattern matching"""
        # Remove excessive whitespace and normalize
        cleaned = re.sub(r'\s+', ' ', text)
        
        # Remove common OCR artifacts but keep important punctuation
        cleaned = re.sub(r'[^\w\s\$\.\,\-\/\(\):\%]', ' ', cleaned)
        
        # Normalize currency symbols
        cleaned = re.sub(r'\$\s+', '$', cleaned)
        
        return cleaned.strip()
    
    def _detect_institution(self, text: str) -> str:
        """FIXED: More specific institution detection to avoid crossover"""
        text_lower = text.lower()
        
        # Institution detection with specific patterns (ordered by specificity)
        institution_checks = [
            ('wells_fargo', [
                'wells fargo combined statement of accounts',
                'wells fargo everyday checking',
                'wells fargo platinum savings',
                'wells fargo bank, n.a.',
                'wellsfargo.com',
                'statement period activity summary'
            ]),
            ('acorns', [
                'acorns securities llc', 'acorns advisers llc',
                'base investment account', 'acorns.com',
                'valuation at a glance'  # Acorns-specific
            ]),
            ('robinhood', [
                'robinhood securities llc', 'robinhood financial llc',
                'help@robinhood.com', 'robinhood gold',
                'robinhood.com'
            ]),
            ('schwab', [
                'charles schwab co inc', 'schwab one account',
                'schwab.com/login', 'member sipc schwab',
                'schwab representative', 'roth contributory ira'
            ]),
            ('wealthfront', [
                'wealthfront brokerage llc', 'wealthfront advisers', 
                'wealthfront.com', 'support@wealthfront.com',
                'wealthfront cash account', 'wealthfront savings'
            ]),
            ('adp', [
                'transaction and balance history', 'transaction history by fund',
                'personal rate of return', 'mykplan.adp.com',
                'modified dietz method'
            ])
        ]
        
        # Check specific markers first
        for institution, specific_markers in institution_checks:
            for marker in specific_markers:
                if marker in text_lower:
                    logger.info(f"Institution detected by specific marker '{marker}': {institution}")
                    return institution
        
        logger.warning("Could not detect institution from statement text")
        return 'unknown'

    def _extract_wells_fargo_bank(self, text: str) -> StatementData:
        """Extract data from Wells Fargo bank statements - REMOVED account number extraction"""
        logger.info("Extracting Wells Fargo bank statement data")
        
        statement_data = StatementData()
        statement_data.institution = 'Wells Fargo'
        
        # Set account name to just "Checking" - don't extract account numbers
        statement_data.account_type = 'Checking'
        
        # Extract statement date patterns
        date_patterns = [
            r'(\w+\s+\d{1,2},\s+\d{4})',  # "May 31, 2025"
            r'Statement\s+Period:?\s*(\d{1,2}/\d{1,2}/\d{4})\s*-\s*(\d{1,2}/\d{1,2}/\d{4})',
            r'For\s+the\s+period\s+(\w+\s+\d{1,2})\s*-\s*(\w+\s+\d{1,2},\s+\d{4})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    date_str = match.group(1) if len(match.groups()) == 1 else match.group(2)
                    parsed_date = self._parse_date(date_str)
                    if parsed_date:
                        statement_data.statement_period_end = parsed_date
                        logger.info(f"✅ Statement date extracted: {parsed_date}")
                        break
                except Exception as e:
                    logger.warning(f"Date parsing error: {e}")
                    continue
        
        # Extract beginning balance
        beginning_patterns = [
            r'Beginning\s+balance\s+on\s+\d{1,2}/\d{1,2}\s+\$?([\d,]+\.?\d*)',
            r'Previous\s+balance\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Balance\s+forward\s*:?\s*\$?([\d,]+\.?\d*)'
        ]
        
        for pattern in beginning_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        statement_data.beginning_balance = Decimal(amount_str)
                        statement_data.extraction_notes.append(f"Found beginning balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Wells Fargo beginning balance: {e}")
        
        # Extract ending balance
        ending_patterns = [
            r'Ending\s+balance\s+on\s+\d{1,2}/\d{1,2}\s+\$?([\d,]+\.?\d*)',
            r'Current\s+balance\s*:?\s*\$?([\d,]+\.?\d*)',
            r'New\s+balance\s*:?\s*\$?([\d,]+\.?\d*)'
        ]
        
        for pattern in ending_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        statement_data.ending_balance = Decimal(amount_str)
                        statement_data.extraction_notes.append(f"Found ending balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Wells Fargo ending balance: {e}")
        
        return statement_data

    def _extract_adp_401k(self, text: str) -> StatementData:
        """FIXED: ADP 401k extraction - look for Activity by Transaction Type section"""
        data = StatementData()
        data.extraction_notes = []
        
        # Account type
        data.account_type = "401(k) Plan"
        
        # Extract statement period
        period_patterns = [
            r'transaction history by fund for the period:\s*(\d{1,2}/\d{1,2}/\d{4})\s*to\s*(\d{1,2}/\d{1,2}/\d{4})',
            r'for the period\s*(\w+\s+\d{1,2},\s+\d{4})\s*through\s*(\w+\s+\d{1,2},\s+\d{4})'
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_date = self._parse_date(match.group(1))
                    end_date = self._parse_date(match.group(2))
                    if start_date and end_date:
                        data.statement_period_start = start_date
                        data.statement_period_end = end_date
                        data.extraction_notes.append(f"Found ADP statement period: {start_date} to {end_date}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse ADP statement period: {e}")
        
        # FIXED: Extract balances - From screenshot: "Beginning Balance    $28,763.24"
        beginning_patterns = [
            r'beginning balance\s*\$?([\d,]+\.\d{2})',
            r'beginning account value\s*\$?([\d,]+\.\d{2})'
        ]
        
        ending_patterns = [
            r'ending balance\s*\$?([\d,]+\.\d{2})',
            r'ending account value\s*\$?([\d,]+\.\d{2})'
        ]
        
        # Extract beginning balance
        for pattern in beginning_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.beginning_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found ADP beginning balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse ADP beginning balance: {e}")
        
        # Extract ending balance
        for pattern in ending_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.ending_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found ADP ending balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse ADP ending balance: {e}")
        
        return data

    def _extract_acorns(self, text: str) -> StatementData:
        """FIXED: Acorns extraction with exact patterns from screenshots"""
        data = StatementData()
        data.extraction_notes = []
        
        # Account type
        data.account_type = "Base Investment Account"
        
        # Extract statement period - "Monthly Statement for May 1 - 31, 2025"
        period_patterns = [
            r'monthly statement for (\w+) (\d{1,2}) - (\d{1,2}), (\d{4})',
            r'statement for\s*(\w+\s+\d{4})'
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 4:  # "May 1 - 31, 2025" format
                        month_name = match.group(1)
                        end_day = match.group(3)
                        year = match.group(4)
                        date_str = f"{month_name} {end_day}, {year}"
                        end_date = self._parse_date(date_str)
                        if end_date:
                            data.statement_period_end = end_date
                            data.extraction_notes.append(f"Found Acorns statement end date: {date_str}")
                            break
                except Exception as e:
                    logger.warning(f"Failed to parse Acorns statement period: {e}")
        
        # FIXED: Extract balances with exact patterns from Acorns screenshot
        # "Ending Balance (5/31/2025)" followed by "$8,497.93"
        # "Grand Total (5/31/2025)" followed by "$8,497.93"
        balance_patterns = [
            r'ending balance \([^)]+\)\s*\$?([\d,]+\.\d{2})',
            r'grand total \([^)]+\)\s*\$?([\d,]+\.\d{2})',
            r'ending balance\s*\$?([\d,]+\.\d{2})',
            r'grand total\s*\$?([\d,]+\.\d{2})'
        ]
        
        for pattern in balance_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.ending_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found Acorns balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Acorns balance: {e}")
        
        return data

    def _extract_robinhood(self, text: str) -> StatementData:
        """FIXED: Robinhood extraction with exact patterns from screenshots"""
        data = StatementData()
        data.extraction_notes = []
        
        # Account type
        data.account_type = "Brokerage Account"
        
        # Extract statement period
        period_patterns = [
            r'statement period\s*(\w+\s+\d{1,2},\s+\d{4})\s*-\s*(\w+\s+\d{1,2},\s+\d{4})',
            r'for the period\s*(\d{1,2}/\d{1,2}/\d{4})\s*to\s*(\d{1,2}/\d{1,2}/\d{4})'
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_date = self._parse_date(match.group(1))
                    end_date = self._parse_date(match.group(2))
                    if start_date and end_date:
                        data.statement_period_start = start_date
                        data.statement_period_end = end_date
                        data.extraction_notes.append(f"Found Robinhood statement period: {start_date} to {end_date}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Robinhood statement period: {e}")
        
        # FIXED: Extract balances - From screenshot: "Portfolio Value" with "Closing Balance" of "$39,768.93"
        balance_patterns = [
            r'portfolio value.*?closing balance.*?\$?([\d,]+\.\d{2})',
            r'portfolio value.*?\$?([\d,]+\.\d{2})',
            r'total securities.*?\$?([\d,]+\.\d{2})',
            r'closing balance.*?\$?([\d,]+\.\d{2})'
        ]
        
        for pattern in balance_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.ending_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found Robinhood portfolio value: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Robinhood balance: {e}")
        
        return data

    def _extract_schwab(self, text: str) -> StatementData:
        """FIXED: Schwab extraction for BOTH Roth IRA and Brokerage account types"""
        data = StatementData()
        data.extraction_notes = []
        
        # FIXED: Account type detection for both Schwab types
        if 'roth contributory ira' in text.lower():
            data.account_type = "Roth IRA"
        elif 'schwab one' in text.lower():
            data.account_type = "Brokerage Account"
        else:
            data.account_type = "Investment Account"
        
        # Extract statement period - "Statement Period May 1-31, 2025"
        period_patterns = [
            r'statement period\s*(\w+\s+\d{1,2})-(\d{1,2}),\s*(\d{4})',
            r'statement period\s*(\w+\s+\d{1,2},\s+\d{4})\s*-\s*(\w+\s+\d{1,2},\s+\d{4})'
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 3:  # "May 1-31, 2025" format
                        month_name = match.group(1).split()[0]
                        end_day = match.group(2)
                        year = match.group(3)
                        date_str = f"{month_name} {end_day}, {year}"
                        end_date = self._parse_date(date_str)
                        if end_date:
                            data.statement_period_end = end_date
                            data.extraction_notes.append(f"Found Schwab statement end date: {date_str}")
                            break
                except Exception as e:
                    logger.warning(f"Failed to parse Schwab statement period: {e}")
        
        # FIXED: Extract balances - From screenshots: "Ending Account Value as of 05/31" = "$32,071.82"
        balance_patterns = [
            r'endingaccountvalueasof\d{2}/\d{2}.*?\$?([\d,]+\.\d{2})',  # EndingAccountValueasof05/31 $32,071.82
            r'endingaccountvalue.*?\$?([\d,]+\.\d{2})',                  # Fallback
        ]

        beginning_patterns = [
            r'beginningaccountvalueasof\d{2}/\d{2}.*?\$?([\d,]+\.\d{2})',  # BeginningAccountValueasof05/01 $30,193.03
            r'beginningaccountvalue.*?\$?([\d,]+\.\d{2})',                  # Fallback
        ]
        
        # Extract ending balance
        for pattern in balance_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.ending_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found Schwab ending balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Schwab ending balance: {e}")
        
        # Extract beginning balance
        for pattern in beginning_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.beginning_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found Schwab beginning balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Schwab beginning balance: {e}")
        
        return data

    def _extract_wealthfront(self, text: str) -> StatementData:
        """FIXED: Wealthfront extraction for BOTH Investment and Cash account types"""
        data = StatementData()
        data.extraction_notes = []
        logger.info(f"DEBUG: Wealthfront raw text: {text[:500]}")
        
        # FIXED: Account type detection for both Wealthfront types
        if 'individual investment account' in text.lower():
            data.account_type = "Individual Investment Account"
        elif 'individual cash account' in text.lower():
            data.account_type = "Individual Cash Account"
        else:
            data.account_type = "Investment Account"
        
        # Extract statement period - "Monthly Statement for May 1 - 31, 2025"
        period_patterns = [
            r'monthly statement for (\w+) (\d{1,2}) - (\d{1,2}), (\d{4})',
            r'statement period\s*(\w+\s+\d{1,2},\s+\d{4})\s*through\s*(\w+\s+\d{1,2},\s+\d{4})'
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 4:  # "May 1 - 31, 2025" format
                        month_name = match.group(1)
                        end_day = match.group(3)
                        year = match.group(4)
                        date_str = f"{month_name} {end_day}, {year}"
                        end_date = self._parse_date(date_str)
                        if end_date:
                            data.statement_period_end = end_date
                            data.extraction_notes.append(f"Found Wealthfront statement end date: {date_str}")
                            break
                except Exception as e:
                    logger.warning(f"Failed to parse Wealthfront statement period: {e}")
        
        # FIXED: Extract balances - From screenshots: "Starting Balance" and "Ending Balance"
        balance_patterns = [
            r'ending balance\s*\$?([\d,]+\.\d{2})',    # "Ending Balance $10,262.27"
            r'endingbalance\s*\$?([\d,]+\.\d{2})',     # No space fallback
        ]

        beginning_patterns = [
            r'starting balance\s*\$?([\d,]+\.\d{2})',   # "Starting Balance $10,226.02"  
            r'startingbalance\s*\$?([\d,]+\.\d{2})',    # No space fallback
        ]
        
        # Extract ending balance
        for pattern in balance_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.ending_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found Wealthfront ending balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Wealthfront ending balance: {e}")
        
        # Extract beginning balance
        for pattern in beginning_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.beginning_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found Wealthfront beginning balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Wealthfront beginning balance: {e}")
        
        return data

    def _clean_amount_string(self, amount_str: str) -> str:
        """FIXED: Better amount cleaning to handle commas properly"""
        if not amount_str:
            return ""
        
        # Remove all non-digit, non-decimal, non-comma characters
        cleaned = re.sub(r'[^\d\.,]', '', amount_str)
        
        # Remove commas (they're thousands separators)
        cleaned = cleaned.replace(',', '')
        
        # Ensure we have a valid number
        try:
            float(cleaned)
            return cleaned
        except ValueError:
            return ""

    def _parse_date(self, date_str: str) -> Optional[date]:
        """Parse various date formats"""
        if not date_str:
            return None
        
        date_formats = [
            '%m/%d/%Y',
            '%m/%d/%y',
            '%B %d, %Y',
            '%b %d, %Y',
            '%Y-%m-%d'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt).date()
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None

    def _parse_month_year(self, month_year_str: str) -> Optional[date]:
        """Parse month/year strings like 'March 2025'"""
        if not month_year_str:
            return None
        
        try:
            # Try to parse as "Month Year"
            parsed = datetime.strptime(month_year_str.strip(), '%B %Y')
            # Return last day of the month
            if parsed.month == 12:
                return date(parsed.year + 1, 1, 1) - timedelta(days=1)
            else:
                return date(parsed.year, parsed.month + 1, 1) - timedelta(days=1)
        except ValueError:
            try:
                # Try abbreviated month
                parsed = datetime.strptime(month_year_str.strip(), '%b %Y')
                if parsed.month == 12:
                    return date(parsed.year + 1, 1, 1) - timedelta(days=1)
                else:
                    return date(parsed.year, parsed.month + 1, 1) - timedelta(days=1)
            except ValueError:
                logger.warning(f"Could not parse month/year: {month_year_str}")
                return None

    def _calculate_confidence(self, statement_data: StatementData, text: str) -> float:
        """Calculate confidence score based on successful extractions"""
        confidence_factors = []
        
        # Institution detection
        if statement_data.institution and statement_data.institution != 'unknown':
            confidence_factors.append(0.8)
        else:
            confidence_factors.append(0.2)
        
        # Balance extraction
        if statement_data.beginning_balance and statement_data.ending_balance:
            confidence_factors.append(0.9)
        elif statement_data.ending_balance:
            confidence_factors.append(0.7)
        else:
            confidence_factors.append(0.3)
        
        # Date extraction
        if statement_data.statement_period_start and statement_data.statement_period_end:
            confidence_factors.append(0.9)
        elif statement_data.statement_period_end:
            confidence_factors.append(0.7)
        else:
            confidence_factors.append(0.4)
        
        # Account type extraction - now more important since we removed account numbers
        if statement_data.account_type:
            confidence_factors.append(0.8)
        else:
            confidence_factors.append(0.5)
        
        # Extraction notes indicate successful pattern matching
        if len(statement_data.extraction_notes) >= 3:
            confidence_factors.append(0.9)
        elif len(statement_data.extraction_notes) >= 2:
            confidence_factors.append(0.8)
        elif len(statement_data.extraction_notes) >= 1:
            confidence_factors.append(0.6)
        else:
            confidence_factors.append(0.3)
        
        # Calculate weighted average
        return sum(confidence_factors) / len(confidence_factors)