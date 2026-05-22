# Company Database

A simple web application for managing company employee registrations and records.

## What It Does

- **Register employees** with their name, gender, age, and address
- **View all records** in a table with automatic timestamps
- **Search records** by employee name
- **View statistics** including total count, gender breakdown, and age statistics
- **Clear all records** with one click (with confirmation)

## How to Get Started

### Step 1: Install Python
Make sure you have Python 3.7 or higher installed on your computer.

### Step 2: Install Dependencies
Open a terminal or command prompt in this project folder and run:
```
pip install -r requirements.txt
```

### Step 3: Run the Application
```
python app.py
```

### Step 4: Open in Browser
Go to your browser and visit:
```
http://localhost:5000
```

## How to Use

1. **Register a New Employee**: Fill in the form with name, select gender (M/F), enter age, and address, then click "Register"
2. **View All Records**: Click the "View All" button to see all registered employees
3. **Search**: Type an employee name and click "Search" to find specific records
4. **Refresh**: Click "Refresh" to reload the dashboard with latest data
5. **Clear Data**: Click "Clear All" to delete all records (this action cannot be undone)

## Project Structure

- `app.py` - Main Flask application (backend logic)
- `app.js` - Browser functionality (frontend logic)
- `index.html` - Main page structure
- `style.css` - Page styling
- `details.txt` - Database file (stores employee records)

## How Data is Stored

Employee records are saved in `details.txt` as formatted text. Each record includes:
- Name (converted to uppercase)
- Gender (M or F)
- Age (as a number)
- Address (converted to uppercase)
- Date and time of registration

## Notes

- No special database setup needed - it uses a simple text file
- All data is stored locally on your computer
- The app runs in debug mode, which means changes to code will automatically reload the server
