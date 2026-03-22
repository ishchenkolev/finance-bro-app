import socket

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Connect to an external address to find the interface used for internet
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    ip = get_local_ip()
    print("--- 📱 Инфо для подключения ---")
    print(f"Твой локальный IP: {ip}")
    print(f"URL для приложения Flet: http://{ip}:8550")
    print("--------------------------------")
    print("\nУбедись, что телефон и компьютер в одной Wi-Fi сети!")
