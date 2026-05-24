from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import datetime
import os
from flask_cors import CORS
from functools import wraps

# App configuration
# Setting both folder paths to '.' means HTML, CSS, and JS 
# files can all live together in your project root directory.
app = Flask(__name__, static_folder='.', static_url_path='')
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Secret key configuration
app.secret_key = os.environ.get("SECRET_KEY", "")

# Admin password
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

CORS(app)

@app.route('/style.css')
def serve_css():
    return app.send_static_file('style.css')

@app.route('/app.js')
def serve_app_js():
    return app.send_static_file('app.js')

@app.route('/admin.js')
def serve_admin_js():
    return app.send_static_file('admin.js')

FILE = os.path.join(os.path.dirname(__file__), "details.txt")
PORT = int(os.environ.get("PORT", 5000))
DEBUG = os.environ.get("FLASK_ENV") == "development"


# Auth decorator — protects sensitive routes
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return jsonify({"success": False, "message": "Unauthorized. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated


# Helper: reading all records from details.txt
def read_all_records():
    if not os.path.exists(FILE):
        return []

    records = []
    current = {}

    with open(FILE, "r") as f:
        for line in f:
            line = line.strip()

            if line.startswith("Name    :"):
                current["name"] = line.split(":", 1)[1].strip()
            elif line.startswith("Gender  :"):
                current["gender"] = line.split(":", 1)[1].strip()
            elif line.startswith("Age     :"):
                current["age"] = line.split(":", 1)[1].strip()
            elif line.startswith("Address :"):
                current["address"] = line.split(":", 1)[1].strip()
            elif line.startswith("Date    :"):
                current["date"] = line.split(":", 1)[1].strip()
            elif line.startswith("=" * 30) and current:
                if "name" in current:
                    records.append(current)
                    current = {}

    return records

# Helper: save one record to details.txt
def save_record(name, gender, age, address):
    date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(FILE, "a") as f:
        f.write("=" * 30 + "\n")
        f.write(f"Name    : {name.strip().upper()}\n")
        f.write(f"Gender  : {gender.strip().upper()}\n")
        f.write(f"Age     : {age}\n")
        f.write(f"Address : {address.strip().upper()}\n")
        f.write(f"Date    : {date}\n")
        f.write("=" * 30 + "\n\n")


# Public Routes

@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or request.form.to_dict()

    if not isinstance(data, dict):
        return jsonify({"success": False, "message": "Invalid request format."}), 400

    name    = str(data.get("name", "")).strip()
    gender  = str(data.get("gender", "")).strip().upper()
    age     = str(data.get("age", "")).strip()
    address = str(data.get("address", "")).strip()

    if not name:
        return jsonify({"success": False, "message": "Name is required."})
    if gender not in ("M", "F"):
        return jsonify({"success": False, "message": "Gender must be M or F."})
    if not age.isdigit() or int(age) <= 0:
        return jsonify({"success": False, "message": "Age must be a positive number."})
    if not address:
        return jsonify({"success": False, "message": "Address is required."})

    save_record(name, gender, age, address)

    return jsonify({"success": True, "message": "Registration successful! Your details have been recorded."})


# Admin Auth Routes

@app.route("/admin")
def admin():
    return app.send_static_file("admin.html")


@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(silent=True) or {}
    password = str(data.get("password", "")).strip()

    if password == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        return jsonify({"success": True, "message": "Login successful."})
    else:
        return jsonify({"success": False, "message": "Incorrect password."}), 401


@app.route("/admin/logout", methods=["POST"])
def admin_logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out."})


@app.route("/admin/check")
def admin_check():
    return jsonify({"logged_in": bool(session.get("admin_logged_in"))})


# Protected Admin Data Routes

@app.route("/records")
@login_required
def records():
    all_records = read_all_records()
    return jsonify(all_records)


@app.route("/stats")
@login_required
def stats():
    all_records = read_all_records()

    male_count   = sum(1 for r in all_records if r.get("gender") == "M")
    female_count = sum(1 for r in all_records if r.get("gender") == "F")

    ages = []
    for r in all_records:
        try:
            ages.append(int(r.get("age", 0)))
        except ValueError:
            pass

    avg_age = round(sum(ages) / len(ages), 1) if ages else 0

    return jsonify({
        "total"   : len(all_records),
        "male"    : male_count,
        "female"  : female_count,
        "avg_age" : avg_age,
        "youngest": min(ages) if ages else 0,
        "oldest"  : max(ages) if ages else 0,
    })


@app.route("/search")
@login_required
def search():
    query = request.args.get("name", "").strip().upper()
    all_records = read_all_records()

    if not query:
        return jsonify([])

    results = [r for r in all_records if query in r.get("name", "").upper()]
    return jsonify(results)


@app.route("/clear", methods=["POST"])
@login_required
def clear():
    try:
        with open(FILE, "w") as f:
            f.write("")
        return jsonify({"success": True, "message": "All records cleared."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


if __name__ == "__main__":
    # Standard local setup execution
    app.run(host="127.0.0.1", port=5000, debug=True)