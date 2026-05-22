from flask import Flask, render_template, request, jsonify
import datetime
import os
from flask_cors import CORS



app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
CORS(app)  # Enabling CORS for all routes (allows cross-origin requests from the frontend)
FILE = os.path.join(os.path.dirname(__file__), "details.txt")
PORT = int(os.environ.get("PORT", 5000))
DEBUG = os.environ.get("FLASK_ENV") == "development"


# 
# Helper Functions (internal logic — not routes).
# These functions handle file reading/writing and data processing.
def read_all_records():
    if not os.path.exists(FILE):
        return []

    records = []
    current = {}  # Temporary holder for one person's data

    with open(FILE, "r") as f:
        for line in f:
            line = line.strip()

            if line.startswith("Name    :"):
                current["name"] = line.split(":", 1)[1].strip()
                # split(":", 1) - splits only on the FIRST colon
                # Avoids breaking if address contains a colon

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
                    current = {}  # Resetting for next person

    return records


def save_record(name, gender, age, address):
    """
    Appends one new record to details.txt.
    Called when the registration form is submitted.
    """
    date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # Getting current date and time as a readable string

    with open(FILE, "a") as f:
        # "a" mode = append — it never overwrites existing records.
        f.write("=" * 30 + "\n")
        f.write(f"Name    : {name.strip().upper()}\n")
        f.write(f"Gender  : {gender.strip().upper()}\n")
        f.write(f"Age     : {age}\n")
        f.write(f"Address : {address.strip().upper()}\n")
        f.write(f"Date    : {date}\n")
        f.write("=" * 30 + "\n\n")


# ROUTES — Each route = one URL the browser can visit

@app.route("/") 
def index():
    return render_template("index.html")


@app.route("/register", methods=["POST"])
def register():
    """
    Handles the registration form submission.
    methods=["POST"] - only accepts POST requests (form submissions)
    Browser sends form data - Flask reads it - saves to file - replies with JSON
    """
    data = request.get_json(silent=True) or request.form.to_dict()
    # Accept JSON from fetch() or fallback to standard form encoding.

    if not isinstance(data, dict):
        return jsonify({"success": False, "message": "Invalid request format. Please submit form data."}), 400

    name    = str(data.get("name", "")).strip()
    gender  = str(data.get("gender", "")).strip().upper()
    age     = str(data.get("age", "")).strip()
    address = str(data.get("address", "")).strip()

    #  Server-side validation - ensuring data is present and in correct format before saving
    if not name:
        return jsonify({"success": False, "message": "Name is required."})

    if gender not in ("M", "F"):
        return jsonify({"success": False, "message": "Gender must be M or F."})

    if not age.isdigit() or int(age) <= 0:
        return jsonify({"success": False, "message": "Age must be a positive number."})

    if not address:
        return jsonify({"success": False, "message": "Address is required."})

    save_record(name, gender, age, address)
    # Calling the helper function to write to file

    return jsonify({"success": True, "message": f"{name.upper()} registered successfully!"})
    # Sending back a JSON response the browser's JavaScript will read


@app.route("/records")
def records():
    """
    Returning ALL records as JSON.
    Browser calls this to populate the "View All" table.
    """
    all_records = read_all_records()
    return jsonify(all_records)
    # Converting Python list of dicts to JSON array


@app.route("/stats")
def stats():
    """
    Returning statistics: total, male count, female count, age data.
    Browser calls this to populate the dashboard stats cards.
    """
    all_records = read_all_records()

    male_count   = sum(1 for r in all_records if r.get("gender") == "M")
    female_count = sum(1 for r in all_records if r.get("gender") == "F")
    # sum(1 for ...) = efficient way to count items that match a condition

    ages = []
    for r in all_records:
        try:
            ages.append(int(r.get("age", 0)))
        except ValueError:
            pass  # Skipping, if age somehow isn't a number

    avg_age = round(sum(ages) / len(ages), 1) if ages else 0
    # Ternary: calculating average only if list isn't empty (avoids division by zero).

    return jsonify({
        "total"   : len(all_records),
        "male"    : male_count,
        "female"  : female_count,
        "avg_age" : avg_age,
        "youngest": min(ages) if ages else 0,
        "oldest"  : max(ages) if ages else 0,
    })


@app.route("/search")
def search():
    """
    Searches records by name.
    Browser sends ?name=JOHN → Flask reads it → filters records → returns JSON
    """
    query = request.args.get("name", "").strip().upper()
    # request.args = URL query parameters (things after the ? in the URL)

    all_records = read_all_records()

    if not query:
        return jsonify([])  # Returning empty list if no search term

    results = [r for r in all_records if query in r.get("name", "").upper()]
    # List comprehension: keeping only records where the search term appears in the name

    return jsonify(results)


@app.route("/clear", methods=["POST"])
def clear():
    try:
        with open(FILE, "w") as f:
            f.write("")  # Overwriting with blank = clears all content
        return jsonify({"success": True, "message": "All records cleared."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


# Running the app:

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
   
