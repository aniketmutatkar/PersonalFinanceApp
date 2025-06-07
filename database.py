"""
Database setup and session management for the Finance Tracker application.
Updated to include portfolio tracking tables.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, Date, Boolean, DateTime, Table, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database setup
DB_NAME = 'finances.db'
DB_URL = f'sqlite:///{DB_NAME}'
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db_session():
    """Create and return a new database session"""
    session = SessionLocal()
    try:
        return session
    except:
        session.close()
        raise


class TransactionModel(Base):
    """SQLAlchemy model for Transaction table with proper DATE column"""
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)  # Now using proper DATE column
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    source = Column(String, nullable=False)
    month = Column(String, nullable=False)  # Month in YYYY-MM format
    transaction_hash = Column(String, unique=True, nullable=False)
    
    def __repr__(self):
        return f"<Transaction(date='{self.date}', amount={self.amount}, category='{self.category}')>"


class InvestmentAccountModel(Base):
    """SQLAlchemy model for Investment Accounts"""
    __tablename__ = 'investment_accounts'
    
    id = Column(Integer, primary_key=True)
    account_name = Column(String, unique=True, nullable=False)
    institution = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # 'brokerage', 'roth_ira', '401k', 'cash'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<InvestmentAccount(name='{self.account_name}', institution='{self.institution}')>"


class PortfolioBalanceModel(Base):
    """SQLAlchemy model for Portfolio Balances"""
    __tablename__ = 'portfolio_balances'
    
    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, nullable=False)  # References investment_accounts.id
    balance_date = Column(Date, nullable=False)
    balance_amount = Column(Float, nullable=False)
    data_source = Column(String, nullable=False)  # 'csv_import', 'manual', 'pdf_statement'
    confidence_score = Column(Float, default=1.0)  # For OCR results (0.0-1.0)
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<PortfolioBalance(account_id={self.account_id}, date='{self.balance_date}', amount={self.balance_amount})>"


class StatementUploadModel(Base):
    """SQLAlchemy model for Statement Uploads (for future OCR functionality)"""
    __tablename__ = 'statement_uploads'
    
    id = Column(Integer, primary_key=True)
    account_id = Column(Integer, nullable=False)  # References investment_accounts.id
    statement_date = Column(Date, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String)
    raw_extracted_text = Column(String)
    extracted_balance = Column(Float)
    confidence_score = Column(Float, default=0.0)
    requires_review = Column(Boolean, default=False)
    reviewed_by_user = Column(Boolean, default=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<StatementUpload(account_id={self.account_id}, filename='{self.original_filename}')>"


def create_monthly_summary_table(categories):
    """Create the monthly_summary table with dynamic columns based on categories"""
    metadata = MetaData()
    
    # Prepare columns list
    columns = [
        Column('id', Integer, primary_key=True),
        Column('month', String),
        Column('year', Integer),
        Column('month_year', String, unique=True),
    ]
    
    # Add category columns
    for category in categories:
        columns.append(Column(category, Float, default=0))
    
    # Add calculated columns
    columns.append(Column('investment_total', Float, default=0))
    columns.append(Column('total', Float, default=0))
    columns.append(Column('total_minus_invest', Float, default=0))
    
    # Create table definition
    monthly_summary = Table('monthly_summary', metadata, *columns)
    
    # Create the table if it doesn't exist
    metadata.create_all(bind=engine)
    
    return monthly_summary


def seed_investment_accounts():
    """Seed the investment accounts table with the 7 core accounts"""
    accounts_data = [
        {
            'account_name': 'Wealthfront Investment',
            'institution': 'Wealthfront', 
            'account_type': 'brokerage'
        },
        {
            'account_name': 'Schwab Brokerage',
            'institution': 'Schwab',
            'account_type': 'brokerage'
        },
        {
            'account_name': 'Acorns',
            'institution': 'Acorns',
            'account_type': 'brokerage'
        },
        {
            'account_name': 'Robinhood',
            'institution': 'Robinhood', 
            'account_type': 'brokerage'
        },
        {
            'account_name': '401(k) Plan',
            'institution': 'ADP',
            'account_type': '401k'
        },
        {
            'account_name': 'Roth IRA',
            'institution': 'Schwab',
            'account_type': 'roth_ira'
        },
        {
            'account_name': 'Wealthfront Cash',
            'institution': 'Wealthfront',
            'account_type': 'cash'
        }
    ]
    
    session = get_db_session()
    try:
        # Check if accounts already exist
        existing_count = session.query(InvestmentAccountModel).count()
        if existing_count > 0:
            print(f"Investment accounts already seeded ({existing_count} accounts found)")
            return
        
        # Insert accounts
        for account_data in accounts_data:
            account = InvestmentAccountModel(**account_data)
            session.add(account)
        
        session.commit()
        print(f"Successfully seeded {len(accounts_data)} investment accounts")
        
        # Print the seeded accounts for verification
        accounts = session.query(InvestmentAccountModel).all()
        for account in accounts:
            print(f"  - {account.account_name} ({account.institution}, {account.account_type})")
            
    except Exception as e:
        session.rollback()
        print(f"Error seeding investment accounts: {str(e)}")
        raise
    finally:
        session.close()


def init_database(categories):
    """Initialize the SQLite database with required tables"""
    print("Initializing database...")
    
    # Create all SQLAlchemy tables
    Base.metadata.create_all(bind=engine)
    
    # Create monthly_summary table with dynamic columns
    create_monthly_summary_table(categories)
    
    # Seed investment accounts
    seed_investment_accounts()
    
    # Add portfolio constraints
    add_portfolio_constraints()
    
    print("Database initialized successfully with portfolio tracking tables.")


def add_portfolio_constraints():
    """Add database constraints for portfolio tables"""
    session = get_db_session()
    try:
        # Add unique constraint for portfolio_balances (account_id, balance_date)
        session.execute(text("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_balances_unique 
        ON portfolio_balances(account_id, balance_date)
        """))
        
        # Add index for faster queries
        session.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_portfolio_balances_date 
        ON portfolio_balances(balance_date)
        """))
        
        session.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_portfolio_balances_account 
        ON portfolio_balances(account_id)
        """))
        
        session.commit()
        print("Added portfolio database constraints and indexes")
        
    except Exception as e:
        session.rollback()
        print(f"Warning: Could not add constraints: {str(e)}")
    finally:
        session.close()