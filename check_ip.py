import socket

def check_all_ips():
    hostname = socket.gethostname()
    host_info = socket.gethostbyname_ex(hostname)
    ips = host_info[2]
    
    print("\n--- 🔍 СКАНЕР IP-АДРЕСОВ ---")
    print(f"Имя хоста: {hostname}")
    for i, ip in enumerate(ips):
        print(f"[{i+1}] Нашел локальный IP: {ip}")
        print(f"    👉 ВСТАВЛЯЙ В ТЕЛЕФОН: http://{ip}:8550\n")
    print("----------------------------\n")
    print("Если ни один не работает:")
    print("1. Проверь, что телефон и ПК в одной Wi-Fi сети.")
    print("2. Отключи Брандмауэр Windows ( firewall ) для порта 8550.")
    print("3. Отключи VPN на компьютере.")

if __name__ == "__main__":
    check_all_ips()
