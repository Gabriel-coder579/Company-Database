# Company Database

Hey! This is a simple Flask project where people can register their details, but only I (the admin) can see all the records. Normal users just register and get a success message — their info stays private.

---

## What’s in this folder?

Everything is in one place, no subfolders:

- **app.py** — The backend (Flask)
- **index.html** — The page normal users see (just the registration form)
- **admin.html** — The admin dashboard (where I can see everything)
- **app.js** — JavaScript for the public registration page
- **admin.js** — JavaScript for the admin dashboard
- **style.css** — All the styling
- **details.txt** — Where all the registered data is stored (this file gets created automatically)
- **README.md** — This file

---

## How it works

- Regular users go to the website and just fill in their name, gender, age, and address.
- After they submit, they only see a “Registration successful” message. They **cannot** see anyone’s data.
- I can go to `/admin` to log in with a password and see all the records, stats, search, and even clear everything if needed.

---

## How to run it

1. Install the required packages:

```bash
pip install flask flask-cors

export ADMIN_PASSWORD=mypasswordhere

python app.py
