from flask import Flask, request, jsonify
import sqlite3
import logging
from datetime import datetime

app = Flask(__name__)
DB_NAME = "threat_logs.db"

# Setup database
def setup_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS threats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT,
                    description TEXT,
                    timestamp TEXT
                )''')
    conn.commit()
    conn.close()

# Log threat into database and file
def log_threat(threat_type, description):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT INTO threats (type, description, timestamp) VALUES (?, ?, ?)",
              (threat_type, description, timestamp))
    conn.commit()
    conn.close()
    logging.info(f"{timestamp} - {threat_type}: {description}")

@app.route("/simulate", methods=["POST"])
def simulate_threat():
    data = request.json
    threat_type = data.get("type")
    description = data.get("description")
    if threat_type and description:
        log_threat(threat_type, description)
        return jsonify({"status": "Threat logged"}), 200
    return jsonify({"error": "Invalid input"}), 400

if __name__ == "__main__":
    print("[INFO] Starting Flask backend...")
    logging.basicConfig(filename="threat_activity.log", level=logging.INFO)
    setup_db()
    print("[INFO] Database ready.")
    app.run(port=5001)
