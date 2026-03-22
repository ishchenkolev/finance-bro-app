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
        "Ты — личный финансовый бро-ассистент. Общаешься на 'ты', используешь сленг, коротко и жестко по делу. "
        f"Финансы пользователя прямо сейчас: Сумма ежемесячных платежей по кредитам: {total_payments:,.0f} ₸. "
        f"Ожидаемый доход до платежа: {expected_income:,.0f} ₸. СВОБОДНЫЙ ЛИМИТ НА ТРАТЫ: {free_limit:,.0f} ₸. "
        f"Пользователь спрашивает: '{user_message}' (например: 'Тусовка 15000'). "
        "Твоя задача: Сравни стоимость покупки со СВОБОДНЫМ ЛИМИТОМ. "
        "Если стоимость больше лимита — жестко ЗАПРЕТИ. Если меньше — РАЗРЕШИ, но напомни, сколько останется. "
        "Алгоритм ответа: 1. Оценка покупки. 2. Вердикт (РАЗРЕШАЮ / НЕ СОВЕТУЮ / ЗАПРЕЩАЮ) капсом. "
        "3. Краткое дерзкое обоснование. "
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
