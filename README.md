# Finance Tracker

A comprehensive personal finance tracking system that processes financial transactions from multiple banks, categorizes them automatically, and provides detailed visualizations and reports.

## 📊 Features

- **Multi-Bank Support**: Import and process transaction data from Chase, Citi, and Wells Fargo
- **Automatic Categorization**: Smart categorization system using predefined rules
- **Transaction Deduplication**: Prevent duplicate entries with robust hash-based identification
- **Interactive Dashboard**: Visualize your financial data with Streamlit and Plotly
- **Budget Analysis**: Compare actual spending against budget targets
- **Historical Data Import**: Import and analyze past financial data
- **Investment Tracking**: Monitor investment accounts across multiple platforms
- **SQLite Database**: Robust data storage with SQLAlchemy ORM

## 🛠️ Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/finance-tracker.git
   cd finance-tracker
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```
   python main.py
   ```

## 📋 Requirements

- Python 3.7+
- SQLAlchemy
- Pandas
- PyYAML
- Streamlit
- Plotly
- FuzzyWuzzy (for smart categorization)
- Tabulate

## 🚀 Usage

### Adding Transaction Data

1. Place your bank CSV exports in the `raw` directory:
   - Chase exports should contain "chase" in the filename
   - Citi exports should contain "citi" in the filename
   - Wells Fargo exports should contain "wells" or "fargo" in the filename

2. Run the main script to process transactions:
   ```
   python main.py
   ```

### Launching the Dashboard

To view your financial data in the interactive dashboard:

```
streamlit run visualizations.py
```

This will open a web browser with the visualization dashboard.

### Importing Historical Data

To import historical data from an Excel file:

```
python run_historical_import.py
```

### Viewing Monthly Summary

For a text-based summary of monthly data:

```
python view_monthly_summary.py
```

## 📁 Project Structure

- `main.py` - Main entry point for processing data
- `config.yaml` - Configuration file with category rules and budget values
- `src/` - Core modules:
  - `__init__.py` - Module initialization
  - `database.py` - Database models and operations
  - `import_data.py` - Transaction import and categorization logic
  - `reporting.py` - Report generation functions
- `raw/` - Directory for raw transaction CSV files
- `transformed/` - Directory for processed output files
- `visualizations.py` - Streamlit dashboard for data visualization
- `run_historical_import.py` - Utility for importing historical data
- `view_monthly_summary.py` - Utility for viewing monthly summary data

## ⚙️ Configuration

The system is configured through `config.yaml`, which contains:

- Category definitions and keywords for automatic categorization
- Category mapping for standardizing imported categories
- Monthly budget values for each category

Example configuration:

```yaml
categories:
  Payment:
    - autopay
    - epay
    - online payment
  Rent: 
    - clickpay
    - rent
  # ... more categories

budgets:
  Rent: 2405
  Food: 600
  # ... more budget values
```

## 📊 Dashboard Features

The interactive Streamlit dashboard includes:

1. **Monthly Summary**:
   - Complete financial overview by month
   - Detailed transaction drill-down
   - Visual category breakdown

2. **Yearly Trends**:
   - Investment performance over time
   - Expense trend analysis
   - Income analysis with year-over-year changes

3. **Budget Analysis**:
   - Budget vs. actual comparison
   - Visual indicators for over-budget categories
   - Monthly and yearly budget tracking

## 📝 Notes

- The system automatically handles different bank formats and standardizes amounts.
- Transactions are hashed based on date, description, amount, and source to prevent duplicates.
- For transactions categorized as "Misc", the system may prompt for manual categorization.

## 🔍 Troubleshooting

If you encounter issues:

- Check your CSV file formats match the expected bank formats
- Ensure the `raw` and `transformed` directories exist
- Check the database file permissions

## 🛣️ Roadmap

Planned features for future releases:

- Support for additional banks and financial institutions
- Machine learning-based categorization improvements
- Goal tracking and forecasting
- Mobile application interface

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.