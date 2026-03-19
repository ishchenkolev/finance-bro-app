from database import get_loans, get_settings
from datetime import datetime, timedelta
import calendar

def get_working_days_count(start_date, end_date, days_off_per_week):
    """Counts work days between two dates inclusive."""
    count = 0
    current = start_date
    while current <= end_date:
        # 0=Mon, 6=Sun
        weekday = current.weekday()
        if days_off_per_week == 1:
            if weekday != 6: # Only Sunday is off
                count += 1
        else: # Default 2 days off (Sat, Sun)
            if weekday < 5: 
                count += 1
        current += timedelta(days=1)
    return count

def calculate_forecast(current_money):
    loans = get_loans()
    settings = get_settings() # (stable_salary, days_off_per_week)
    
    daily_salary = settings[0]
    days_off = settings[1]
    
    total_payments = sum(loan[2] for loan in loans)
    
    if not loans:
        return {"error": "Сначала добавь хотя бы один кредит, бро!"}

    # Find the nearest upcoming payment date
    today = datetime.now()
    upcoming_dates = []
    
    for loan in loans:
        p_day = loan[3]
        year = today.year
        month = today.month
        
        try:
            # Try this month
            p_date = datetime(year, month, p_day)
            if p_date < today:
                # Move to next month
                if month == 12:
                    p_date = datetime(year + 1, 1, p_day)
                else:
                    # Handle last day of month if p_day > next month length
                    last_day_next = calendar.monthrange(year, month + 1)[1]
                    p_date = datetime(year, month + 1, min(p_day, last_day_next))
        except ValueError:
            # Day out of range for current month (e.g. 31st)
            last_day = calendar.monthrange(year, month)[1]
            p_date = datetime(year, month, last_day)
            if p_date < today:
                # Next month
                next_month = month + 1 if month < 12 else 1
                next_year = year if month < 12 else year + 1
                last_day_next = calendar.monthrange(next_year, next_month)[1]
                p_date = datetime(next_year, next_month, last_day_next)
        
        upcoming_dates.append(p_date)
    
    nearest_date = min(upcoming_dates)
    
    # Work days from tomorrow to the deadline
    work_days = get_working_days_count(today + timedelta(days=1), nearest_date, days_off)
    expected_income = work_days * daily_salary
    total_at_date = current_money + expected_income
    free_limit = total_at_date - total_payments
    
    # Format report (Strictly 1 emoji!)
    report_text = (
        f"Привет, бро. Твои обязательные платежи: {total_payments:,.0f} ₸. "
        f"До ближайшего списания {work_days} рабочих дней. "
        f"За это время ты заработаешь {expected_income:,.0f} ₸. "
        f"С учетом твоих текущих денег ({current_money:,.0f} ₸), к дате икс у тебя будет {total_at_date:,.0f} ₸. "
        f"Твой свободный лимит на траты прямо сейчас: {free_limit:,.0f} ₸. "
        f"Потратишь больше — уйдешь в минус к дате платежа. 📊"
    )
    
    return {
        "report": report_text,
        "free_limit": free_limit,
        "total_payments": total_payments,
        "work_days": work_days,
        "expected_income": expected_income
    }
