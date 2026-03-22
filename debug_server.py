import socket
import psutil

def get_interfaces():
    print("\n--- 🌐 СЕТЕВЫЕ ИНТЕРФЕЙСЫ ---")
    interfaces = psutil.net_if_addrs()
    for name, addrs in interfaces.items():
        for addr in addrs:
            if addr.family == socket.AF_INET:
                print(f"Интерфейс: {name} | IP: {addr.address}")

def check_port(port):
    print(f"\n--- 🔌 ПРОВЕРКА ПОРТА {port} ---")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("0.0.0.0", port))
        print(f"✅ Порт {port} СВОБОДЕН и готов к работе.")
    except socket.error:
        print(f"❌ Порт {port} ЗАНЯТ другим процессом!")
    finally:
        s.close()

if __name__ == "__main__":
    get_interfaces()
    check_port(8000)
