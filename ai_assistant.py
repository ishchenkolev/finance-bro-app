import os
import requests
from finance_calc import calculate_forecast

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_bro_response(user_message, current_money):
    # Calculate current situation
    report = calculate_forecast(current_money)
    
    if "error" in report:
        return report["error"]

    total_payments = report['total_payments']
    expected_income = report['expected_income']
    free_limit = report['free_limit']

    system_prompt = (
        "Ты — личный финансовый бро-ассистент и безжалостный охотник на банковские ловушки. Общаешься на 'ты', используешь сленг, коротко и жестко по делу. "
        f"Финансы пользователя прямо сейчас: Сумма ежемесячных платежей: {total_payments:,.0f} ₸. "
        f"Ожидаемый доход: {expected_income:,.0f} ₸. СВОБОДНЫЙ ЛИМИТ НА ТРАТЫ: {free_limit:,.0f} ₸. "
        f"Пользователь пишет: '{user_message}'. "
        "Твои задачи: "
        "1. Оценка трат: Сравни цену покупки с лимитом. Если покупка съест почти весь лимит — жестко ЗАПРЕТИ. Если ок — РАЗРЕШИ. "
        "2. Разоблачение банков: Если пользователь спрашивает про свои кредиты, обязательно напоминай про ловушку аннуитетного графика (в первые годы он платит только проценты банку, а его реальный долг почти не уменьшается). "
        "3. Досрочка: Всегда агрессивно советуй закидывать любые свободные деньги в досрочное погашение, чтобы сжечь переплату. "
        "Алгоритм ответа: Вердикт капсом и краткое дерзкое обоснование. "
        "ЖЕСТКОЕ ПРАВИЛО: Использовать максимум 1 (один) эмодзи на весь ответ!"
    )

    api_url = "https://api.groq.com/openai/v1/chat/completions"
    model = "llama-3.3-70b-versatile"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }

    try:
        response = requests.post(api_url, headers=headers, json=data, timeout=15)
        if response.status_code != 200:
            return f"Бро, API ругается (Groq, код {response.status_code}). Попробуй позже. 🤜"
        
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception as e:
        return f"Бро, связь прервалась... Глюк в матрице. Проверь сеть. 🤜"

if __name__ == "__main__":
    pass
