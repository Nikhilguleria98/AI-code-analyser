# frontend_gui.py
import tkinter as tk
from tkinter import ttk, messagebox
import hashlib
import sqlite3
import requests

DB_NAME = "threat_logs.db"
ADMIN_HASH = hashlib.sha256("admin123".encode()).hexdigest()

class ThreatSimGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("ThreatSim Dashboard")
        self.geometry("900x600")
        self.configure(bg="#f0f0f0")
        self.conn = sqlite3.connect(DB_NAME)
        self.cursor = self.conn.cursor()
        self.create_login_ui()

    def create_login_ui(self):
        self.login_frame = tk.Frame(self, bg="#f0f0f0")
        self.login_frame.place(relx=0.5, rely=0.5, anchor="center")

        tk.Label(self.login_frame, text="Admin Login", font=("Arial", 18)).pack(pady=10)
        self.username_entry = tk.Entry(self.login_frame, width=30)
        self.username_entry.insert(0, "admin")
        self.username_entry.pack(pady=5)
        self.password_entry = tk.Entry(self.login_frame, show="*", width=30)
        self.password_entry.pack(pady=5)
        tk.Button(self.login_frame, text="Login", command=self.check_login).pack(pady=10)

    def check_login(self):
        user = self.username_entry.get()
        pwd = self.password_entry.get()
        hashed = hashlib.sha256(pwd.encode()).hexdigest()
        if user == "admin" and hashed == ADMIN_HASH:
            self.login_frame.destroy()
            self.create_dashboard()
        else:
            messagebox.showerror("Login Failed", "Incorrect credentials!")

    def create_dashboard(self):
        tk.Label(self, text="Threat Simulation Dashboard", font=("Helvetica", 18), bg="#f0f0f0").pack(pady=10)
        button_frame = tk.Frame(self, bg="#f0f0f0")
        button_frame.pack()

        threats = [
            ("Brute Force Attack", "Multiple failed login attempts"),
            ("SQL Injection", "Injection in login form"),
            ("Malware Upload", "Suspicious .exe uploaded"),
            ("Phishing Attempt", "Fake login page accessed")
        ]

        for name, desc in threats:
            tk.Button(button_frame, text=name, width=25,
                      command=lambda t=name, d=desc: self.simulate_threat(t, d)).pack(pady=5)

        self.tree = ttk.Treeview(self, columns=("Type", "Description", "Timestamp"), show="headings")
        self.tree.heading("Type", text="Threat Type")
        self.tree.heading("Description", text="Description")
        self.tree.heading("Timestamp", text="Timestamp")
        self.tree.pack(fill='both', expand=True, pady=20)

        self.load_logs()

    def simulate_threat(self, threat_type, description):
        try:
            response = requests.post("http://127.0.0.1:5001/simulate", json={
                "type": threat_type,
                "description": description
            })
            if response.status_code == 200:
                messagebox.showinfo("Success", f"{threat_type} simulated!")
                self.load_logs()
            else:
                messagebox.showerror("Failed", "Threat simulation failed.")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def load_logs(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        self.cursor.execute("SELECT type, description, timestamp FROM threats ORDER BY id DESC")
        for row in self.cursor.fetchall():
            self.tree.insert('', 'end', values=row)

if __name__ == "__main__":
    app = ThreatSimGUI()
    app.mainloop()
