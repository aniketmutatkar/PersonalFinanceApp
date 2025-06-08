# src/services/statement_parser.py

"""
Enhanced Statement Parser Service with institution-specific patterns
Based on actual PDF structures for maximum accuracy
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from datetime import date, datetime
from decimal import Decimal
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class StatementData:
    """Extracted statement data"""
    institution: Optional[str] = None
    account_type: Optional[str] = None
    account_number: Optional[str] = None
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
        """Enhanced institution detection with priority order"""
        text_lower = text.lower()
        
        # Institution detection with VERY specific keywords to avoid conflicts
        institution_checks = [
            ('wealthfront', [
                'wealthfront brokerage llc', 'wealthfront advisers', 
                'monthly statement for march', 'individual investment account',
                'wealthfront.com', 'support@wealthfront.com',
                'wealthfront cash account',
                'investment account' 
                'wealthfront savings',
                'cash account'
            ]),
            ('acorns', [
                'acorns securities llc', 'acorns advisers llc',
                'base investment account', 'acorns.com',
                'irvine ca 92617'  # Acorns specific address
            ]),
            ('robinhood', [
                'robinhood securities llc', 'robinhood financial llc',
                'help@robinhood.com', 'robinhood gold',
                'lake mary fl 32746'  # Robinhood specific address
            ]),
            ('schwab', [
                'charles schwab co inc', 'schwab one account',
                'schwab.com/login', 'member sipc schwab',
                'schwab representative'
            ]),
            ('adp', [
                'transaction and balance history', 'transaction history by fund',
                'personal rate of return', 'mykplan.adp.com',
                'modified dietz method'  # ADP specific methodology
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

    def _extract_adp_401k(self, text: str) -> StatementData:
        """Extract data from ADP 401k statements with precise patterns"""
        data = StatementData()
        data.extraction_notes = []
        
        # Account type - always 401k for ADP
        data.account_type = "401(k) Plan"
        
        # Statement period - "Transaction History by Fund for the period: 3/1/2025 to 3/31/2025"
        period_patterns = [
            r'transaction history by fund for the period:\s*(\d{1,2}/\d{1,2}/\d{4})\s*to\s*(\d{1,2}/\d{1,2}/\d{4})',
            r'for the period:\s*(\d{1,2}/\d{1,2}/\d{4})\s*to\s*(\d{1,2}/\d{1,2}/\d{4})',
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_date = self._parse_date(match.group(1))
                    end_date = self._parse_date(match.group(2))
                    data.statement_period_start = start_date
                    data.statement_period_end = end_date
                    data.extraction_notes.append(f"Found period: {match.group(1)} to {match.group(2)}")
                    break
                except Exception as e:
                    logger.warning(f"Failed to parse ADP dates: {e}")
        
        # Balance extraction - "Beginning Balance $28,070.81" and "Ending Balance $27,691.29"
        beginning_patterns = [
            r'beginning balance\s*\$?([\d,]+\.?\d*)',
            r'beginning account value\s*\$?([\d,]+\.?\d*)',
        ]
        
        ending_patterns = [
            r'ending balance\s*\$?([\d,]+\.?\d*)',
            r'ending account value\s*\$?([\d,]+\.?\d*)',
        ]
        
        # Extract beginning balance
        for pattern in beginning_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.beginning_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found beginning balance: ${amount_str}")
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
                        data.extraction_notes.append(f"Found ending balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse ADP ending balance: {e}")
        
        return data

    def _extract_acorns(self, text: str) -> StatementData:
        """Extract data from Acorns statements with precise patterns"""
        data = StatementData()
        data.extraction_notes = []
        
        # Account type
        data.account_type = "Base Investment Account"
        
        # Account number - "Account Number 1620557603281"
        account_patterns = [
            r'account number\s*(\d+)',
            r'account #\s*(\d+)',
        ]
        
        for pattern in account_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data.account_number = match.group(1)
                data.extraction_notes.append(f"Found account number: {match.group(1)}")
                break
        
        # Statement period - "Statement Period 2/1/2025 - 2/28/2025"
        period_patterns = [
            r'statement period\s*(\d{1,2}/\d{1,2}/\d{4})\s*-\s*(\d{1,2}/\d{1,2}/\d{4})',
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_date = self._parse_date(match.group(1))
                    end_date = self._parse_date(match.group(2))
                    data.statement_period_start = start_date
                    data.statement_period_end = end_date
                    data.extraction_notes.append(f"Found period: {match.group(1)} to {match.group(2)}")
                    break
                except Exception as e:
                    logger.warning(f"Failed to parse Acorns dates: {e}")
        
        # Balance extraction - "Opening Balance $8,192.08" and "Ending Balance (2/28/2025) $8,193.66"
        beginning_patterns = [
            r'opening balance\s*\$?([\d,]+\.?\d*)',
            r'starting balance\s*\$?([\d,]+\.?\d*)',
        ]
        
        ending_patterns = [
            r'ending balance\s*\([^)]+\)\s*\$?([\d,]+\.?\d*)',  # "Ending Balance (2/28/2025) $8,193.66"
            r'ending balance\s*\$?([\d,]+\.?\d*)',
            r'grand total\s*\([^)]+\)\s*\$?([\d,]+\.?\d*)',     # "Grand Total (2/28/2025) $8,193.66"
        ]
        
        # Extract beginning balance
        for pattern in beginning_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.beginning_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found beginning balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Acorns beginning balance: {e}")
        
        # Extract ending balance
        for pattern in ending_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.ending_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found ending balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse Acorns ending balance: {e}")
        
        return data

    def _extract_robinhood(self, text: str) -> StatementData:
        """Extract data from Robinhood statements with precise patterns"""
        data = StatementData()
        data.extraction_notes = []
        
        # Account number - "Account #:650286784"
        account_patterns = [
            r'account #:\s*(\d+)',
            r'account number:\s*(\d+)',
        ]
        
        for pattern in account_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data.account_number = match.group(1)
                data.extraction_notes.append(f"Found account number: {match.group(1)}")
                break
        
        # Statement period - "03/01/2025 to 03/31/2025"
        period_patterns = [
            r'(\d{2}/\d{2}/\d{4})\s*to\s*(\d{2}/\d{2}/\d{4})',
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_date = self._parse_date(match.group(1))
                    end_date = self._parse_date(match.group(2))
                    data.statement_period_start = start_date
                    data.statement_period_end = end_date
                    data.extraction_notes.append(f"Found period: {match.group(1)} to {match.group(2)}")
                    break
                except Exception as e:
                    logger.warning(f"Failed to parse Robinhood dates: {e}")
        
        # Balance extraction - look for "Portfolio Value" in the closing section
        ending_patterns = [
            r'portfolio value\s+\$?([\d,]+\.?\d*)\s*$',  # At end of line
            r'closing balance.*?portfolio value.*?\$?([\d,]+\.?\d*)',
            r'total securities.*?\$?([\d,]+\.?\d*)',
        ]
        
        # Extract ending balance (Portfolio Value)
        for pattern in ending_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        # Validate it's a reasonable portfolio amount (> $1000)
                        amount = Decimal(amount_str)
                        if amount > 1000:
                            data.ending_balance = amount
                            data.extraction_notes.append(f"Found portfolio value: ${amount_str}")
                            break
                except Exception as e:
                    logger.warning(f"Failed to parse Robinhood balance: {e}")
        
        # If we didn't find portfolio value, look for specific Robinhood patterns
        if not data.ending_balance:
            # "Portfolio Value $34,074.90 $32,472.42" - take the second value (closing)
            portfolio_patterns = [
                r'portfolio value.*?\$[\d,]+\.?\d*\s+\$?([\d,]+\.?\d*)',
            ]
            
            for pattern in portfolio_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    try:
                        amount_str = self._clean_amount_string(match.group(1))
                        if amount_str:
                            amount = Decimal(amount_str)
                            if amount > 1000:
                                data.ending_balance = amount
                                data.extraction_notes.append(f"Found closing portfolio value: ${amount_str}")
                                break
                    except Exception as e:
                        logger.warning(f"Failed to parse Robinhood closing balance: {e}")
        
        return data

    def _extract_schwab(self, text: str) -> StatementData:
        """Extract data from Schwab statements with precise patterns"""
        data = StatementData()
        data.extraction_notes = []
        
        # Enhanced account type detection - CHECK ROTH FIRST!
        text_lower = text.lower()
        
        # Check for Roth IRA patterns first (based on the actual statement)
        if any(phrase in text_lower for phrase in [
            'roth contributory ira',    # From the header
            'roth ira',                # General
            'contributory ira',        # From the statement
            'roth individual retirement',
            'ira account'
        ]):
            data.account_type = "Roth IRA"
            data.extraction_notes.append("Detected Roth IRA account type")
        # Then check for regular brokerage
        elif any(phrase in text_lower for phrase in [
            'schwab one', 'brokerage', 'one account'
        ]):
            data.account_type = "Schwab One Account"  
            data.extraction_notes.append("Detected brokerage account type")
        else:
            # Default
            data.account_type = "Investment Account"
            data.extraction_notes.append("Default investment account type")
        
        # Account number - "7085-8463" pattern for Roth IRA
        account_patterns = [
            r'account number\s*(\d{4}-\d{4})',
            r'(\d{4}-\d{4})',  # Direct pattern match
        ]
        
        for pattern in account_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data.account_number = match.group(1)
                data.extraction_notes.append(f"Found account number: {match.group(1)}")
                break
        
        # Statement period extraction from OCR text patterns
        period_patterns = [
            # "March 1-31, 2025" format from clean text
            r'statement period\s*(\w+\s+\d{1,2}-\d{1,2},\s*\d{4})',
            r'(\w+\s+\d{1,2}-\d{1,2},\s*\d{4})',
            # Extract dates from the balance pattern itself
            r'endingaccountvalueasof(\d{2}/\d{2})\s+beginningaccountvalueasof(\d{2}/\d{2})',
            r'ending.*?account.*?value.*?as.*?of.*?(\d{2}/\d{2})',
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 2 and '/' in match.group(1):
                        # Format: "03/31" and "03/01" - need to add year
                        end_date_str = match.group(1)
                        start_date_str = match.group(2)
                        
                        # Extract year from somewhere else in the text
                        year_match = re.search(r'(20\d{2})', text)
                        year = year_match.group(1) if year_match else "2025"
                        
                        end_date = self._parse_date(f"{end_date_str}/{year}")
                        start_date = self._parse_date(f"{start_date_str}/{year}")
                        
                        if end_date:
                            data.statement_period_end = end_date
                            data.extraction_notes.append(f"Found end date: {end_date_str}/{year}")
                        if start_date:
                            data.statement_period_start = start_date
                            data.extraction_notes.append(f"Found start date: {start_date_str}/{year}")
                        break
                    else:
                        # Parse "March 1-31, 2025" format
                        period_str = match.group(1)
                        if '-' in period_str and ',' in period_str:
                            parts = period_str.replace(',', '').split()
                            if len(parts) >= 3:
                                month_str = parts[0]
                                day_range = parts[1].split('-')
                                year_str = parts[2]
                                
                                if len(day_range) == 2:
                                    start_day = day_range[0]
                                    end_day = day_range[1]
                                    
                                    start_date = self._parse_date(f"{month_str} {start_day}, {year_str}")
                                    end_date = self._parse_date(f"{month_str} {end_day}, {year_str}")
                                    
                                    data.statement_period_start = start_date
                                    data.statement_period_end = end_date
                                    data.extraction_notes.append(f"Found period: {period_str}")
                                    break
                except Exception as e:
                    logger.warning(f"Failed to parse Schwab dates: {e}")
        
        # Enhanced balance extraction based on actual OCR patterns
        # Pattern: "EndingAccountValueasof03/31 BeginningAccountValueasof03/01 $30,398.27 $32,249.84"
        # The amounts come AFTER the labels: Ending balance first, Beginning balance second
        
        schwab_balance_patterns = [
            # Primary pattern from your OCR output
            r'endingaccountvalueasof\d{2}/\d{2}\s+beginningaccountvalueasof\d{2}/\d{2}\s+\$([\d,]+\.?\d{2})\s+\$([\d,]+\.?\d{2})',
            # Alternative patterns
            r'ending.*?account.*?value.*?\$([\d,]+\.?\d{2})\s+\$([\d,]+\.?\d{2})',
            r'ending.*?value.*?\$([\d,]+\.?\d{2}).*?beginning.*?value.*?\$([\d,]+\.?\d{2})',
        ]
        
        for pattern in schwab_balance_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    # First amount is ending balance, second is beginning balance
                    ending_amount_str = self._clean_amount_string(match.group(1))
                    beginning_amount_str = self._clean_amount_string(match.group(2))
                    
                    if ending_amount_str:
                        data.ending_balance = Decimal(ending_amount_str)
                        data.extraction_notes.append(f"Found ending balance: ${ending_amount_str}")
                    
                    if beginning_amount_str:
                        data.beginning_balance = Decimal(beginning_amount_str)
                        data.extraction_notes.append(f"Found beginning balance: ${beginning_amount_str}")
                    
                    if ending_amount_str or beginning_amount_str:
                        break
                        
                except Exception as e:
                    logger.warning(f"Failed to parse Schwab balances: {e}")
        
        # Fallback patterns if the main pattern doesn't work
        if not data.ending_balance:
            fallback_ending_patterns = [
                r'ending account value\s*\$?([\d,]+\.?\d*)',
                r'ending.*?value.*?\$?([\d,]+\.?\d*)',
            ]
            
            for pattern in fallback_ending_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    try:
                        amount_str = self._clean_amount_string(match.group(1))
                        if amount_str:
                            data.ending_balance = Decimal(amount_str)
                            data.extraction_notes.append(f"Found ending balance (fallback): ${amount_str}")
                            break
                    except Exception as e:
                        logger.warning(f"Failed to parse Schwab ending balance (fallback): {e}")
        
        if not data.beginning_balance:
            fallback_beginning_patterns = [
                r'beginning account value\s*\$?([\d,]+\.?\d*)',
                r'beginning.*?value.*?\$?([\d,]+\.?\d*)',
            ]
            
            for pattern in fallback_beginning_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    try:
                        amount_str = self._clean_amount_string(match.group(1))
                        if amount_str:
                            data.beginning_balance = Decimal(amount_str)
                            data.extraction_notes.append(f"Found beginning balance (fallback): ${amount_str}")
                            break
                    except Exception as e:
                        logger.warning(f"Failed to parse Schwab beginning balance (fallback): {e}")
        
        return data

    def _extract_wealthfront(self, text: str) -> StatementData:
        """Extract data from Wealthfront statements with precise patterns"""
        data = StatementData()
        data.extraction_notes = []
        
        # Account type - distinguish between Investment and Cash accounts
        if 'individual investment account' in text.lower():
            data.account_type = "Individual Investment Account"
        elif any(x in text.lower() for x in ['cash account', 'savings', 'high yield']):
            data.account_type = "Cash Account"
        else:
            data.account_type = "Investment Account"
        
        # Account number patterns
        account_patterns = [
            r'individual automated investing account\s*([A-Z0-9]+)',
            r'account.*?([A-Z0-9]{8})',
            r'cash account\s*([A-Z0-9]+)',  # ADD THIS
        ]
        
        for pattern in account_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data.account_number = match.group(1)
                data.extraction_notes.append(f"Found account identifier: {match.group(1)}")
                break
        
        # Enhanced date extraction for "March 1 - 31, 2025" format
        period_patterns = [
            r'monthly statement for\s*(\w+\s+\d{1,2}\s*-\s*\d{1,2},\s*\d{4})',
            r'statement for\s*(\w+\s+\d{1,2}\s*-\s*\d{1,2},\s*\d{4})',
            r'(\w+ \d{1,2} - \d{1,2}, \d{4})',  # ADD THIS
            r'as of (\w+\s+\d{1,2},\s*\d{4})',  # ADD THIS
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    period_str = match.group(1)
                    logger.info(f"Found period string: '{period_str}'")
                    
                    # Parse "March 1 - 31, 2025" or "March 31, 2025" format
                    if '-' in period_str:
                        # "March 1 - 31, 2025" format
                        parts = period_str.replace(',', '').split()
                        if len(parts) >= 4:
                            month_str = parts[0]
                            end_day = parts[3]  # Skip "1", "-", get "31"
                            year_str = parts[4]
                            
                            # Use end date as statement date
                            end_date_str = f"{month_str} {end_day}, {year_str}"
                            end_date = self._parse_date(end_date_str)
                            
                            if end_date:
                                data.statement_period_end = end_date
                                data.extraction_notes.append(f"Found period end: {end_date_str}")
                                logger.info(f"Parsed end date: {end_date}")
                                break
                    else:
                        # "March 31, 2025" format
                        end_date = self._parse_date(period_str)
                        if end_date:
                            data.statement_period_end = end_date
                            data.extraction_notes.append(f"Found statement date: {period_str}")
                            break
                            
                except Exception as e:
                    logger.warning(f"Failed to parse Wealthfront date '{period_str}': {e}")
        
        # Enhanced balance extraction patterns
        beginning_patterns = [
            r'starting balance\s*\$?([\d,]+\.?\d*)',
            r'beginning balance\s*\$?([\d,]+\.?\d*)',
            r'previous balance\s*\$?([\d,]+\.?\d*)',
        ]
        
        ending_patterns = [
            r'ending balance\s*\$?([\d,]+\.?\d*)',
            r'current balance\s*\$?([\d,]+\.?\d*)',
            r'final balance\s*\$?([\d,]+\.?\d*)',
            r'total\s*\$?([\d,]+\.?\d*)',  # For cash accounts
        ]
        
        # Extract balances
        for pattern in beginning_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str:
                        data.beginning_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found beginning balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse beginning balance: {e}")
        
        for pattern in ending_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount_str = self._clean_amount_string(match.group(1))
                    if amount_str and float(amount_str) > 10:  # Minimum threshold
                        data.ending_balance = Decimal(amount_str)
                        data.extraction_notes.append(f"Found ending balance: ${amount_str}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to parse ending balance: {e}")
        
        return data

    def _clean_amount_string(self, raw_amount: str) -> Optional[str]:
        """Clean extracted amount text for safe Decimal conversion"""
        if not raw_amount:
            return None
        
        # Convert to string and strip whitespace
        cleaned = str(raw_amount).strip()
        
        # Remove common currency symbols and formatting
        cleaned = re.sub(r'[,$\s]', '', cleaned)  # Remove commas, dollar signs, spaces
        cleaned = re.sub(r'[A-Za-z]', '', cleaned)  # Remove letters (USD, CAD, etc.)
        cleaned = re.sub(r'[^\d.-]', '', cleaned)  # Keep only digits, dots, dashes
        
        # Handle parentheses for negative amounts
        if '(' in str(raw_amount) and ')' in str(raw_amount):
            cleaned = '-' + cleaned.lstrip('-')
        
        # Validate the result is a proper decimal format
        if not re.match(r'^-?\d+\.?\d*$', cleaned):
            logger.warning(f"Invalid decimal format after cleaning: '{cleaned}' from '{raw_amount}'")
            return None
        
        # Ensure we have at least some digits
        if not any(c.isdigit() for c in cleaned):
            return None
        
        return cleaned

    def _parse_date(self, date_str: str) -> Optional[date]:
        """Enhanced date parsing for various formats"""
        if not date_str:
            return None
            
        # Clean the string
        date_str = date_str.strip()
        
        # Common date formats to try
        formats = [
            '%B %d, %Y',      # "March 31, 2025"
            '%b %d, %Y',      # "Mar 31, 2025"
            '%m/%d/%Y',       # "03/31/2025"
            '%Y-%m-%d',       # "2025-03-31"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: '{date_str}'")
        return None

    def _calculate_confidence(self, data: StatementData, text: str) -> float:
        """Enhanced confidence calculation based on successful extractions"""
        confidence_factors = []
        
        # Institution detection (high weight)
        if data.institution and data.institution != 'unknown':
            confidence_factors.append(0.95)
        else:
            confidence_factors.append(0.1)
        
        # Balance extraction (high weight)
        if data.ending_balance and data.ending_balance > 0:
            confidence_factors.append(0.95)
        elif data.beginning_balance and data.beginning_balance > 0:
            confidence_factors.append(0.7)
        else:
            confidence_factors.append(0.1)
        
        # Date extraction (medium weight)
        if data.statement_period_end:
            confidence_factors.append(0.9)
        elif data.statement_period_start:
            confidence_factors.append(0.6)
        else:
            confidence_factors.append(0.3)
        
        # Account info (medium weight)
        if data.account_type and data.account_number:
            confidence_factors.append(0.9)
        elif data.account_type or data.account_number:
            confidence_factors.append(0.7)
        else:
            confidence_factors.append(0.4)
        
        # Extraction notes indicate successful pattern matching
        if len(data.extraction_notes) >= 3:
            confidence_factors.append(0.9)
        elif len(data.extraction_notes) >= 2:
            confidence_factors.append(0.8)
        elif len(data.extraction_notes) >= 1:
            confidence_factors.append(0.6)
        else:
            confidence_factors.append(0.3)
        
        # Calculate weighted average
        return sum(confidence_factors) / len(confidence_factors)


# Convenience function for easy importing
def parse_statement_text(text: str) -> StatementData:
    """
    Convenience function to parse statement text
    
    Args:
        text: Raw text extracted from PDF
        
    Returns:
        StatementData with extracted information
    """
    parser = StatementParser()
    return parser.parse_statement(text)