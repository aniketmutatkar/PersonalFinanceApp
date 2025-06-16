# Finance Tracker

A comprehensive personal finance management system built with **FastAPI + React** that processes financial transactions, manages investments, and provides detailed analytics through an interactive dashboard.

## 🏗️ Architecture

### **Backend (FastAPI + Python)**
- **FastAPI API Server** (`src/api/`) - RESTful API with automatic OpenAPI documentation
- **Data Processing Engine** (`main.py`) - Standalone transaction processor and categorizer  
- **SQLAlchemy ORM** (`database.py`) - Database models and schema management
- **Repository Pattern** (`src/repositories/`) - Data access layer
- **Service Layer** (`src/services/`) - Business logic and processing

### **Frontend (React + TypeScript)**
- **React 18** with TypeScript for type safety
- **TanStack Query** for server state management and caching
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Recharts** for data visualizations
- **Lucide React** for icons

### **Database**
- **SQLite** with SQLAlchemy ORM
- Automated schema creation and migrations
- Hash-based duplicate detection
- Optimized indexes for query performance

## 🎯 Core Features

### **Transaction Management**
- **Multi-Bank Support**: Automated import from Chase, Citi, Wells Fargo CSV exports
- **Smart Categorization**: Keyword-based automatic transaction categorization
- **Duplicate Detection**: Hash-based deduplication prevents duplicate entries
- **Manual Override**: Edit categories and add custom transactions

### **Investment Tracking**
- **Portfolio Management**: Track multiple investment accounts (401k, Roth IRA, Brokerage, etc.)
- **Performance Analytics**: Calculate returns, growth rates, and allocation
- **Statement Processing**: PDF statement parsing and data extraction
- **Balance History**: Historical balance tracking with confidence scoring

### **Financial Analytics**
- **Monthly Summaries**: Automated expense categorization and budget comparison
- **Trend Analysis**: Multi-year spending patterns and investment growth
- **Budget Tracking**: Set and monitor category-based budgets
- **Net Worth Calculation**: Combined liquid and investment asset tracking

### **Interactive Dashboard**
- **Real-time Data**: Live financial metrics and account balances
- **Visual Charts**: Interactive expense trends, category breakdowns, investment performance
- **Drill-down Analysis**: Click through to detailed transaction views
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices

## 🚀 Getting Started

### **Prerequisites**
- Python 3.12+
- Node.js 18+
- npm or yarn

### **1. Backend Setup**

```bash
# Clone the repository
git clone <your-repo-url>
cd finance-tracker

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create configuration file
cp config.yaml.example config.yaml  # Edit with your categories and budgets

# Initialize database
python main.py
```

### **2. Frontend Setup**

```bash
# Navigate to React app
cd finance-dashboard

# Install dependencies
npm install

# Start development server
npm start
```

### **3. API Server**

```bash
# From project root, start FastAPI server
python run_api.py --reload

# API will be available at:
# - Swagger docs: http://localhost:8000/docs
# - API endpoints: http://localhost:8000/api/*
```

### **4. Access the Application**

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Base**: http://localhost:8000/api

## 📊 Usage Workflow

### **Initial Data Import**
1. **Historical Data**: Place Excel files in root directory, run `python main.py`
2. **Bank Transactions**: Place CSV exports in `raw/` directory
3. **Manual Processing**: Use the React dashboard to review and categorize

### **Regular Usage**
1. **Upload New Data**: Use the web interface to upload bank CSV files
2. **Review Transactions**: Check auto-categorized transactions for accuracy
3. **Analyze Trends**: View monthly summaries, budget performance, investment growth
4. **Generate Reports**: Export data for external analysis

### **Investment Tracking**
1. **Upload Statements**: PDF bank/brokerage statements via web interface
2. **Manual Entry**: Add account balances directly through forms
3. **Performance Review**: Track growth, deposits, and allocation changes

## 🛠️ Development

### **Project Structure**
```
finance-tracker/
├── src/
│   ├── api/                 # FastAPI application
│   │   ├── main.py         # FastAPI app and CORS configuration
│   │   ├── dependencies.py # Dependency injection
│   │   └── routers/        # API route handlers
│   ├── models/             # Database models and Pydantic schemas
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic layer
│   └── config/             # Configuration management
├── finance-dashboard/       # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API client and utilities
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── main.py                 # Standalone data processor
├── database.py             # Database configuration and models
├── run_api.py             # API server runner
└── requirements.txt        # Python dependencies
```

### **Key Technologies**

**Backend Stack:**
- **FastAPI**: Modern Python web framework with automatic API documentation
- **SQLAlchemy**: Python SQL toolkit and ORM
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: Lightning-fast ASGI server
- **Pandas**: Data manipulation and analysis
- **PyYAML**: Configuration file parsing

**Frontend Stack:**
- **React 18**: Latest React with concurrent features
- **TypeScript**: Type-safe JavaScript development
- **TanStack Query**: Powerful data synchronization for React
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Composable charting library built on React components

### **API Documentation**

The FastAPI server automatically generates interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### **Database Schema**

**Core Tables:**
- `transactions`: Individual financial transactions with categorization
- `monthly_summary`: Aggregated monthly expense data by category
- `portfolio_balances`: Investment account balances over time
- `bank_balances`: Bank account statements and balances

### **Configuration**

**config.yaml**: Defines transaction categories, keywords, and budgets
```yaml
categories:
  Food:
    - grocery
    - restaurant
    - doordash
  Transportation:
    - gas
    - uber
    - parking

budgets:
  Food: 800
  Transportation: 300
```

## 🔧 Advanced Features

### **Transaction Processing**
- **Hash-based Deduplication**: Prevents duplicate entries using transaction signatures
- **Fuzzy Categorization**: Uses keyword matching with confidence scoring
- **Manual Review Queue**: Surfaces transactions needing human review

### **Investment Analytics**
- **Performance Calculation**: Annualized returns, growth rates, Sharpe ratios
- **Asset Allocation**: Track portfolio distribution across accounts
- **Benchmark Comparison**: Compare performance against market indices

### **Data Import**
- **Multiple File Formats**: CSV, Excel, PDF statement parsing
- **Bank Format Detection**: Automatically handles different bank CSV structures
- **Error Handling**: Graceful failure handling with detailed error reporting

## 🚦 Development Commands

### **Backend Development**
```bash
# Run API server with hot reload
python run_api.py --reload

# Process new transaction files
python main.py

# Run database migrations (when needed)
python -c "from database import init_database; init_database(['Food', 'Transportation'])"
```

### **Frontend Development**
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

### **Data Management**
```bash
# Import historical data (one-time)
python main.py

# Process new CSV files in raw/ directory
python main.py

# Generate monthly summary report
python -c "from src.services.reporting_service import ReportingService; ReportingService().generate_monthly_summary_report()"
```

## 📈 Performance & Scalability

### **Database Optimization**
- Indexed foreign keys and frequently queried columns
- Hash-based duplicate detection for O(1) lookups
- Batch processing for large data imports

### **Frontend Performance**
- **React Query Caching**: Reduces redundant API calls
- **Code Splitting**: Lazy-loaded routes for faster initial load
- **Optimized Bundling**: Production builds with tree shaking

### **API Performance**
- **FastAPI**: High-performance async framework
- **Dependency Injection**: Efficient resource management
- **Response Caching**: Strategic caching for expensive operations

## 🔒 Security Considerations

### **Development Security**
- CORS configured for localhost development
- Environment-based configuration
- No hardcoded credentials or API keys

### **Data Privacy**
- Local SQLite database (no cloud data storage)
- No external API calls for financial data
- All processing happens locally

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add TypeScript types for new React components
3. Include Pydantic models for new API endpoints
4. Test both frontend and backend changes
5. Update this README for new features or architectural changes

## 📄 License

This project is for personal use. See individual dependencies for their respective licenses.