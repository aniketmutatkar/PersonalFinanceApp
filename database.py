"""
Database setup and session management for the Finance Tracker application.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, Table, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

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
    """SQLAlchemy model for Transaction table"""
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True)
    date = Column(String)
    description = Column(String)
    amount = Column(Float)
    category = Column(String)
    source = Column(String)
    month = Column(String)  # Month in YYYY-MM format
    transaction_hash = Column(String, unique=True)
    
    def __repr__(self):
        return f"<Transaction(date='{self.date}', amount={self.amount}, category='{self.category}')>"


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


def init_database(categories):
    """Initialize the SQLite database with required tables"""
    # Create Transaction table
    Base.metadata.create_all(bind=engine)
    
    # Create monthly_summary table
    create_monthly_summary_table(categories)
    
    print("Database initialized successfully.")