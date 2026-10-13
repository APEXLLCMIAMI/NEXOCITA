import hashlib
import json
import os
import re
import secrets
import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse, unquote


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("NEXOCITA_DB", str(ROOT / "data" / "nexocita.sqlite3")))
TZ = timezone(timedelta(hours=-6))


def now_local():
    return datetime.now(TZ)


def today():
    return now_local().date().isoformat()


def max_date():
    return (now_local().date() + timedelta(days=180)).isoformat()


def default_hours():
    return [
        {"open": "09:00", "close": "17:00", "closed": i == 6}
        for i in range(7)
    ]


def minute(value):
    if not isinstance(value, str) or len(value) != 5 or value[2] != ":":
        raise Problem("Hora no válida.")
    h, m = value.split(":")
    if not (h.isdigit() and m.isdigit()):
        raise Problem("Hora no válida.")
    total = int(h) * 60 + int(m)
    if int(h) > 23 or int(m) > 59:
        raise Problem("Hora no válida.")
    return total


def clock(value):
    return f"{value // 60:02d}:{value % 60:02d}"


def clean_text(value, label, min_len=0, max_len=200):
    if value is None:
        value = ""
    if not isinstance(value, str):
        raise Problem(f"Revisa el campo {label}.")
    value = value.strip()
    if len(value) < min_len or len(value) > max_len:
        raise Problem(f"Revisa el campo {label}.")
    return value


def valid_date(value):
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except (TypeError, ValueError):
        raise Problem("Fecha no válida.")
    if value < today() or value > max_date():
        raise Problem("Elige una fecha desde hoy hasta los próximos 180 días.")
    return value


def token(n=24):
    return secrets.token_hex(n)


def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def hash_password(password, salt):
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    ).hex()


class Problem(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


@contextmanager
def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    con.execute("PRAGMA journal_mode=WAL")
    try:
        with con:
            yield con
    finally:
        con.close()


def init_db():
    with db() as con:
        con.executescript(
            """
            CREATE TABLE IF NOT EXISTS settings(
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS services(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              duration INTEGER NOT NULL,
              active INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS clients(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              phone TEXT NOT NULL UNIQUE,
              email TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS appointments(
              id TEXT PRIMARY KEY,
              client_id INTEGER NOT NULL REFERENCES clients(id),
              service_id INTEGER NOT NULL REFERENCES services(id),
              service_name TEXT NOT NULL,
              duration INTEGER NOT NULL,
              date TEXT NOT NULL,
              start INTEGER NOT NULL,
              notes TEXT NOT NULL DEFAULT '',
              status TEXT NOT NULL DEFAULT 'confirmed',
              token_hash TEXT NOT NULL,
              created TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions(
              token_hash TEXT PRIMARY KEY,
              expires INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_appointments_date_start
              ON appointments(date,start);
            """
        )
        have_hours = con.execute(
            "SELECT 1 FROM settings WHERE key='hours'"
        ).fetchone()
        if not have_hours:
            con.execute(
                "INSERT INTO settings(key,value) VALUES('hours',?)",
                (json.dumps(default_hours()),),
            )
        have_business = con.execute(
            "SELECT 1 FROM settings WHERE key='business'"
        ).fetchone()
        if not have_business:
            con.execute(
                "INSERT INTO settings(key,value) VALUES('business','NEXOCITA')"
            )


def settings(con):
    rows = con.execute("SELECT key,value FROM settings").fetchall()
    return {row["key"]: row["value"] for row in rows}


def row_to_public(row):
    data = dict(row)
    data.pop("token_hash", None)
    data["time"] = clock(data.pop("start"))
    return data


def get_service(con, service_id):
    row = con.execute(
        "SELECT * FROM services WHERE id=? AND active=1", (service_id,)
    ).fetchone()
    if not row:
        raise Problem("El servicio ya no está disponible.")
    return row


def get_appointment(con, appointment_id):
    row = con.execute(
        """
        SELECT a.*, c.name, c.phone, c.email
        FROM appointments a
        JOIN clients c ON c.id=a.client_id
        WHERE a.id=?
        """,
        (appointment_id,),
    ).fetchone()
    if not row:
        raise Problem("Cita no encontrada.", 404)
    return row


def available_slots(con, date, duration, exclude_id=""):
    valid_date(date)
    hours = json.loads(settings(con).get("hours") or json.dumps(default_hours()))
    weekday = (datetime.strptime(date, "%Y-%m-%d").weekday()) % 7
    day = hours[weekday]
    if day.get("closed"):
        return []
    busy = con.execute(
        """
        SELECT start,duration FROM appointments
        WHERE date=? AND status!='cancelled' AND id!=?
        """,
        (date, exclude_id),
    ).fetchall()
    result = []
    start_min = minute(day["open"])
    close_min = minute(day["close"])
    for start in range(start_min, close_min - duration + 1, 15):
        slot_dt = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=TZ)
        slot_dt = slot_dt + timedelta(minutes=start)
        if slot_dt <= now_local():
            continue
        overlap = any(
            start < row["start"] + row["duration"]
            and start + duration > row["start"]
            for row in busy
        )
        if not overlap:
            result.append(clock(start))
    return result


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("X-Frame-Options", "DENY")
        super().end_headers()

    def send_head(self):
        path = unquote(urlparse(self.path).path).lstrip("/") or "index.html"
        public = {"index.html", "panel.html", "dispositivos.html", "documentacion.html", "app.js", "booking.js", "panel.js", "styles.css", "system.css"}
        asset = path.startswith("assets/") and Path(path).suffix.lower() in {".jpg", ".png", ".webp", ".wav", ".webm", ".vtt"}
        resolved = (ROOT / path).resolve()
        if not resolved.is_relative_to(ROOT) or ".." in Path(path).parts or not (path in public or asset) or not resolved.is_file():
            self.send_error(404, "Archivo no disponible")
            return None
        return super().send_head()

    def send_json(self, data, status=200, cookie=None):
        if status < 400 and getattr(self, "transaction_connection", None):
            self.transaction_connection.commit()
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(raw)

    def read_json(self):
        size = int(self.headers.get("Content-Length") or "0")
        if size > 16384:
            raise Problem("Solicitud demasiado grande.", 413)
        if size == 0:
            return {}
        try:
            value = json.loads(self.rfile.read(size).decode("utf-8"))
            if not isinstance(value, dict):
                raise Problem("Solicitud no válida.")
            return value
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise Problem("Solicitud no válida.")

    def session_token(self):
        for item in (self.headers.get("Cookie") or "").split(";"):
            item = item.strip()
            if item.startswith("nexocita_session="):
                return item.split("=", 1)[1]
        return ""

    def authenticated(self, con, required=True):
        value = self.session_token()
        row = None
        if value:
            row = con.execute(
                "SELECT 1 FROM sessions WHERE token_hash=? AND expires>?",
                (digest(value), int(time.time() * 1000)),
            ).fetchone()
        if required and not row:
            raise Problem("Inicia sesión para acceder al panel.", 401)
        return bool(row)

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.route_api("GET")
            return
        super().do_GET()

    def do_POST(self):
        self.route_api("POST")

    def do_PATCH(self):
        self.route_api("PATCH")

    def route_api(self, method):
        try:
            parsed = urlparse(self.path)
            query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
            body = self.read_json() if method != "GET" else {}
            with db() as con:
                if method != "GET":
                    origin = self.headers.get("Origin")
                    if origin and urlparse(origin).netloc != self.headers.get("Host"):
                        raise Problem("Origen no permitido.", 403)
                    con.execute("BEGIN IMMEDIATE")
                self.transaction_connection = con
                self.handle_api(con, parsed.path, query, body, method)
        except Problem as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.IntegrityError:
            self.send_json({"error": "Ese horario acaba de ser reservado. Elige otro."}, 409)
        except Exception:
            self.send_json({"error": "No se pudo completar la operación. Inténtalo de nuevo."}, 503)
        finally:
            self.transaction_connection = None

    def handle_api(self, con, path, query, body, method):
        cfg = settings(con)
        if path == "/api/config" and method == "GET":
            services = con.execute(
                "SELECT * FROM services WHERE active=1 ORDER BY id"
            ).fetchall()
            self.send_json(
                {
                    "business": cfg.get("business", "NEXOCITA"),
                    "hours": json.loads(cfg.get("hours") or json.dumps(default_hours())),
                    "services": [dict(row) for row in services],
                    "setup_required": "password" not in cfg,
                    "setup_key_required": False,
                    "authenticated": self.authenticated(con, False),
                    "today": today(),
                    "max_date": max_date(),
                    "supabase": {
                        "url": os.environ.get("SUPABASE_URL", ""),
                        "anon_key": os.environ.get("SUPABASE_ANON_KEY", os.environ.get("SUPABASE_KEY", "")),
                    },
                }
            )
            return

        if path in ("/api/setup", "/api/login") and method == "POST":
            password = clean_text(body.get("password"), "contraseña", 10, 128)
            if path == "/api/setup":
                if "password" in cfg:
                    raise Problem("El acceso ya fue configurado.", 409)
                business = clean_text(body.get("business"), "negocio", 2, 80)
                salt = token(8)
                con.execute(
                    "INSERT OR REPLACE INTO settings(key,value) VALUES('password',?)",
                    (hash_password(password, salt),),
                )
                con.execute(
                    "INSERT OR REPLACE INTO settings(key,value) VALUES('salt',?)",
                    (salt,),
                )
                con.execute(
                    "INSERT OR REPLACE INTO settings(key,value) VALUES('business',?)",
                    (business,),
                )
                count = con.execute("SELECT COUNT(*) c FROM services").fetchone()["c"]
                if count == 0:
                    con.executemany(
                        "INSERT INTO services(name,duration) VALUES(?,?)",
                        [
                            ("Corte de cabello", 30),
                            ("Corte y barba", 60),
                            ("Consulta general", 45),
                        ],
                    )
            elif not secrets.compare_digest(hash_password(password, cfg.get("salt", "")), cfg.get("password", "")):
                raise Problem("Contraseña incorrecta.", 401)
            value = token(32)
            con.execute(
                "DELETE FROM sessions WHERE expires<?", (int(time.time() * 1000),)
            )
            con.execute(
                "INSERT INTO sessions(token_hash,expires) VALUES(?,?)",
                (digest(value), int(time.time() * 1000) + 28_800_000),
            )
            self.send_json(
                {"ok": True},
                cookie=f"nexocita_session={value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800",
            )
            return

        if path == "/api/logout" and method == "POST":
            con.execute("DELETE FROM sessions WHERE token_hash=?", (digest(self.session_token()),))
            self.send_json(
                {"ok": True},
                cookie="nexocita_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
            )
            return

        if path == "/api/availability" and method == "GET":
            service = get_service(con, query.get("service"))
            self.send_json({"slots": available_slots(con, query.get("date"), service["duration"])})
            return

        if path == "/api/book" and method == "POST":
            if "password" not in cfg:
                raise Problem("El dueño debe configurar el negocio antes de recibir reservas.", 409)
            name = clean_text(body.get("name"), "nombre", 2, 100)
            phone = clean_text(body.get("phone"), "teléfono", 7, 25)
            phone = "".join(ch for ch in phone if ch.isdigit())
            if len(phone) < 7 or len(phone) > 15:
                raise Problem("Introduce un teléfono de 7 a 15 dígitos.")
            email = clean_text(body.get("email", ""), "correo", 0, 150)
            if email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
                raise Problem("Introduce un correo válido.")
            notes = clean_text(body.get("notes", ""), "notas", 0, 500)
            service = get_service(con, body.get("service"))
            date = valid_date(body.get("date"))
            time_value = body.get("time")
            if time_value not in available_slots(con, date, service["duration"]):
                raise Problem("Ese horario ya no está disponible. Elige otro.", 409)
            appointment_id = token(5).upper()
            lookup_token = token(24)
            con.execute(
                "INSERT OR IGNORE INTO clients(name,phone,email) VALUES(?,?,?)",
                (name, phone, email),
            )
            con.execute(
                "UPDATE clients SET name=?, email=? WHERE phone=?",
                (name, email, phone),
            )
            client_id = con.execute(
                "SELECT id FROM clients WHERE phone=?", (phone,)
            ).fetchone()["id"]
            con.execute(
                """
                INSERT INTO appointments
                (id,client_id,service_id,service_name,duration,date,start,notes,token_hash,created)
                VALUES(?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    appointment_id,
                    client_id,
                    service["id"],
                    service["name"],
                    service["duration"],
                    date,
                    minute(time_value),
                    notes,
                    digest(lookup_token),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            self.send_json(
                {
                    "appointment": {
                        "id": appointment_id,
                        "name": name,
                        "service_name": service["name"],
                        "duration": service["duration"],
                        "date": date,
                        "time": time_value,
                        "status": "confirmed",
                    },
                    "token": lookup_token,
                },
                201,
            )
            return

        if path == "/api/my-appointment" and method == "POST":
            item = get_appointment(con, clean_text(body.get("id"), "código", 1, 30))
            lookup_token = clean_text(body.get("token"), "clave", 1, 100)
            if item["token_hash"] != digest(lookup_token):
                raise Problem("Código o clave incorrectos.", 403)
            if body.get("cancel"):
                if item["status"] == "completed":
                    raise Problem("La cita ya fue completada.")
                con.execute(
                    "UPDATE appointments SET status='cancelled' WHERE id=? AND status='confirmed'",
                    (item["id"],),
                )
                item = get_appointment(con, item["id"])
            self.send_json(row_to_public(item))
            return

        if path.startswith("/api/admin/"):
            self.authenticated(con)
            if path == "/api/admin/data" and method == "GET":
                appointments = con.execute(
                    """
                    SELECT a.*, c.name, c.phone, c.email
                    FROM appointments a
                    JOIN clients c ON c.id=a.client_id
                    ORDER BY date,start
                    """
                ).fetchall()
                clients = con.execute(
                    """
                    SELECT c.*, COUNT(a.id) AS visits
                    FROM clients c
                    LEFT JOIN appointments a ON a.client_id=c.id
                    GROUP BY c.id
                    ORDER BY c.name
                    """
                ).fetchall()
                self.send_json(
                    {
                        "appointments": [row_to_public(row) for row in appointments],
                        "clients": [dict(row) for row in clients],
                        "services": [
                            dict(row)
                            for row in con.execute("SELECT * FROM services ORDER BY id")
                        ],
                        "hours": json.loads(cfg.get("hours") or json.dumps(default_hours())),
                        "business": cfg.get("business", "NEXOCITA"),
                    }
                )
                return
            if path == "/api/admin/appointment" and method == "PATCH":
                item = get_appointment(con, body.get("id"))
                status = body.get("status", item["status"])
                date = body.get("date", item["date"])
                time_value = body.get("time", clock(item["start"]))
                if status not in ("confirmed", "completed", "cancelled"):
                    raise Problem("Estado no válido.")
                changed = date != item["date"] or time_value != clock(item["start"])
                if changed and item["status"] != "confirmed":
                    raise Problem("Solo se reprograman citas confirmadas.")
                if status == "confirmed" and (changed or item["status"] != "confirmed") and time_value not in available_slots(con, date, item["duration"], item["id"]):
                    raise Problem("El nuevo horario no está disponible.", 409)
                con.execute(
                    "UPDATE appointments SET date=?,start=?,status=? WHERE id=?",
                    (valid_date(date) if changed else date, minute(time_value), status, item["id"]),
                )
                self.send_json({"ok": True})
                return
            if path == "/api/admin/service" and method == "POST":
                name = clean_text(body.get("name"), "servicio", 2, 80)
                try:
                    duration = int(body.get("duration", 0))
                except (TypeError, ValueError):
                    raise Problem("Duración no válida.")
                if duration < 15 or duration > 240 or duration % 15:
                    raise Problem("Usa una duración de 15 a 240 minutos, en intervalos de 15.")
                con.execute("INSERT INTO services(name,duration) VALUES(?,?)", (name, duration))
                self.send_json({"ok": True}, 201)
                return
            if path == "/api/admin/service" and method == "PATCH":
                con.execute(
                    "UPDATE services SET active=? WHERE id=?",
                    (1 if body.get("active") else 0, body.get("id")),
                )
                self.send_json({"ok": True})
                return
            if path == "/api/admin/client" and method == "PATCH":
                name = clean_text(body.get("name"), "nombre", 2, 100)
                email = clean_text(body.get("email", ""), "correo", 0, 150)
                con.execute(
                    "UPDATE clients SET name=?, email=? WHERE id=?",
                    (name, email, body.get("id")),
                )
                self.send_json({"ok": True})
                return
            if path == "/api/admin/settings" and method == "PATCH":
                business = clean_text(body.get("business"), "negocio", 2, 80)
                hours = body.get("hours")
                if not isinstance(hours, list) or len(hours) != 7:
                    raise Problem("Revisa el horario semanal.")
                for item in hours:
                    if not isinstance(item, dict) or not isinstance(item.get("closed"), bool):
                        raise Problem("Revisa el horario semanal.")
                    open_min = minute(item.get("open"))
                    close_min = minute(item.get("close"))
                    if open_min % 15 or close_min % 15 or close_min <= open_min:
                        raise Problem("Usa intervalos de 15 minutos y un cierre posterior a la apertura.")
                con.execute(
                    "INSERT OR REPLACE INTO settings(key,value) VALUES('business',?)",
                    (business,),
                )
                con.execute(
                    "INSERT OR REPLACE INTO settings(key,value) VALUES('hours',?)",
                    (json.dumps(hours),),
                )
                self.send_json({"ok": True})
                return

        raise Problem("Ruta no encontrada.", 404)


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "8766"))
    host = os.environ.get("HOST", "127.0.0.1")
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"NEXOCITA listo en http://{host}:{port}", flush=True)
    server.serve_forever()