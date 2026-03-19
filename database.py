import sqlite3
import os

DB_PATH = "finance.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Loans table (Expanded)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            monthly_payment REAL NOT NULL,
            payment_date INTEGER NOT NULL,
            total_amount REAL DEFAULT 0,
            issue_date TEXT DEFAULT '',
            term_months INTEGER DEFAULT 0,
            total_overpayment REAL DEFAULT 0,
            current_debt REAL DEFAULT 0
        )
    ''')
    
    # Migration: Add columns if they don't exist (in case table already existed with old schema)
    cursor.execute("PRAGMA table_info(loans)")
    columns = [info[1] for info in cursor.fetchall()]
    new_cols = [
        ("total_amount", "REAL DEFAULT 0"),
        ("issue_date", "TEXT DEFAULT ''"),
        ("term_months", "INTEGER DEFAULT 0"),
        ("total_overpayment", "REAL DEFAULT 0"),
        ("current_debt", "REAL DEFAULT 0")
    ]
    for col_name, col_type in new_cols:
        if col_name not in columns:
            cursor.execute(f"ALTER TABLE loans ADD COLUMN {col_name} {col_type}")
    
    # User state table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_state (
            id INTEGER PRIMARY KEY DEFAULT 1,
            kaspi_balance REAL DEFAULT 0,
            day_cost REAL DEFAULT 0,
            work_days INTEGER DEFAULT 0
        )
    ''')
    
    # Settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            stable_salary REAL DEFAULT 0,
            days_off_per_week INTEGER DEFAULT 1
        )
    ''')
    
    # Initialize singleton rows
    cursor.execute('SELECT COUNT(*) FROM user_state')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO user_state (kaspi_balance, day_cost, work_days) VALUES (0, 0, 0)')
        
    cursor.execute('SELECT COUNT(*) FROM settings')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO settings (stable_salary, days_off_per_week) VALUES (0, 1)')
        
    conn.commit()
    conn.close()

# CRUD for Loans
def add_loan(name, monthly_payment, payment_date, total_amount=0, issue_date="", term_months=0, total_overpayment=0, current_debt=0):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO loans (
            name, monthly_payment, payment_date, 
            total_amount, issue_date, term_months, 
            total_overpayment, current_debt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (name, monthly_payment, payment_date, total_amount, issue_date, term_months, total_overpayment, current_debt))
    conn.commit()
    conn.close()

def get_loans():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, monthly_payment, payment_date, 
               total_amount, issue_date, term_months, 
               total_overpayment, current_debt 
        FROM loans
    ''')
    loans = cursor.fetchall()
    conn.close()
    return loans

def update_loan(loan_id, name, monthly_payment, payment_date, total_amount, issue_date, term_months, total_overpayment, current_debt):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE loans SET 
            name = ?, 
            monthly_payment = ?, 
            payment_date = ?, 
            total_amount = ?, 
            issue_date = ?, 
            term_months = ?, 
            total_overpayment = ?, 
            current_debt = ?
        WHERE id = ?
    ''', (name, monthly_payment, payment_date, total_amount, issue_date, term_months, total_overpayment, current_debt, loan_id))
    conn.commit()
    conn.close()

def delete_loan(loan_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM loans WHERE id = ?', (loan_id,))
    conn.commit()
    conn.close()

# CRUD for User State
def get_user_state():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT kaspi_balance, day_cost, work_days FROM user_state WHERE id = 1')
    state = cursor.fetchone()
    conn.close()
    return state

def update_user_state(kaspi_balance=None, day_cost=None, work_days=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    updates = []
    params = []
    if kaspi_balance is not None:
        updates.append("kaspi_balance = ?")
        params.append(kaspi_balance)
    if day_cost is not None:
        updates.append("day_cost = ?")
        params.append(day_cost)
    if work_days is not None:
        updates.append("work_days = ?")
        params.append(work_days)
    if updates:
        query = f"UPDATE user_state SET {', '.join(updates)} WHERE id = 1"
        cursor.execute(query, tuple(params))
        conn.commit()
    conn.close()

# CRUD for Settings
def get_settings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT stable_salary, days_off_per_week FROM settings WHERE id = 1')
    settings = cursor.fetchone()
    conn.close()
    return settings

def update_settings(stable_salary=None, days_off_per_week=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    updates = []
    params = []
    if stable_salary is not None:
        updates.append("stable_salary = ?")
        params.append(stable_salary)
    if days_off_per_week is not None:
        updates.append("days_off_per_week = ?")
        params.append(days_off_per_week)
    if updates:
        query = f"UPDATE settings SET {', '.join(updates)} WHERE id = 1"
        cursor.execute(query, tuple(params))
        conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
