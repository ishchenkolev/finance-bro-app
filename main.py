import os
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

import database
import finance_calc
import ai_assistant

app = FastAPI(title="Finance Bro API")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Database initialization
database.init_db()

# Models
class Loan(BaseModel):
    name: str
    amount: float
    date: int
    total_amount: float = 0
    issue_date: str = ""
    term_months: int = 0
    total_overpayment: float = 0
    current_debt: float = 0

class Settings(BaseModel):
    stable_salary: float
    days_off_per_week: int

class CalculateRequest(BaseModel):
    current_money: float

class ChatRequest(BaseModel):
    message: str
    current_money: float

# Endpoints
@app.get("/", response_class=HTMLResponse)
async def read_root():
    return FileResponse("templates/index.html")

@app.get("/api/loans")
async def get_loans():
    loans = database.get_loans()
    result = []
    for l in loans:
        total_amount = l[4] or 0  # Берем только общую сумму кредита (без переплаты)
        current_debt = l[8] or 0  # Задолженность на сегодня
        
        if total_amount > 0:
            # Высчитываем, сколько реально закрыто от основного долга
            paid_body = max(0, total_amount - current_debt)
            progress = (paid_body / total_amount) * 100
        else:
            progress = 0
            
        result.append({
            "id": l[0], 
            "name": l[1], 
            "amount": l[2], 
            "date": l[3],
            "total_amount": l[4],
            "issue_date": l[5],
            "term_months": l[6],
            "total_overpayment": l[7],
            "current_debt": l[8],
            "progress_percent": round(max(0, min(100, progress)), 1)
        })
    return result

@app.post("/api/loans")
async def add_loan(loan: Loan):
    database.add_loan(
        loan.name, loan.amount, loan.date,
        loan.total_amount, loan.issue_date, loan.term_months,
        loan.total_overpayment, loan.current_debt
    )
    return {"status": "success"}

@app.put("/api/loans/{loan_id}")
async def update_loan(loan_id: int, loan: Loan):
    database.update_loan(
        loan_id, loan.name, loan.amount, loan.date,
        loan.total_amount, loan.issue_date, loan.term_months,
        loan.total_overpayment, loan.current_debt
    )
    return {"status": "success"}

@app.delete("/api/loans/{loan_id}")
async def delete_loan(loan_id: int):
    database.delete_loan(loan_id)
    return {"status": "success"}

@app.get("/api/settings")
async def get_settings():
    s = database.get_settings()
    return {"stable_salary": s[0], "days_off_per_week": s[1]}

@app.post("/api/settings")
async def update_settings(s: Settings):
    database.update_settings(s.stable_salary, s.days_off_per_week)
    return {"status": "success"}

@app.post("/api/calculate")
async def calculate(req: CalculateRequest):
    result = finance_calc.calculate_forecast(req.current_money)
    return result

@app.post("/api/chat")
async def chat(req: ChatRequest):
    response = ai_assistant.get_bro_response(req.message, req.current_money)
    return {"response": response}

if __name__ == "__main__":
    # Get local IP for convenience
    print("\n--- 🚀 WEB СЕРВЕР ЗАПУЩЕН ---")
    print(f"🖥️  LOCAL:   http://localhost:8000")
    print(f"📱 NETWORK: http://192.168.1.108:8000")
    print("----------------------------\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
