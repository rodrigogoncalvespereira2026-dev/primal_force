import os
import io
import json
import re
import time
import secrets
import threading
import urllib.request
import urllib.parse
from collections import defaultdict
from flask import Flask, Response, jsonify, request, send_from_directory

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass

app = Flask(__name__, static_folder=None)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

NO_CACHE = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}

# Rate limiting
_rate_limits = defaultdict(list)
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 30

def check_rate_limit(ip):
    now = time.time()
    _rate_limits[ip] = [t for t in _rate_limits[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_limits[ip].append(now)
    return True

@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route('/')
def index():
    resp = send_from_directory(BASE_DIR, 'index.html', max_age=0)
    resp.headers.update(NO_CACHE)
    return resp

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return Response('', status=204)
    ip = request.remote_addr
    if not check_rate_limit(ip):
        return jsonify({"error": "Rate limit exceeded. Try again in a minute."}), 429
    dados = request.get_json(silent=True) or {}
    if not GROQ_API_KEY:
        return jsonify({"error": "API not configured"}), 500
    if "messages" not in dados or not isinstance(dados["messages"], list):
        return jsonify({"error": "Invalid request format"}), 400
    body = json.dumps(dados).encode("utf-8")
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "User-Agent": "PrimalForce/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        return Response(data, mimetype="application/json")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        return Response(error_body, status=e.code, mimetype="application/json")
    except Exception:
        return jsonify({"error": "Service temporarily unavailable"}), 502

@app.route('/weather', methods=['GET'])
def weather():
    city = request.args.get("city", "Lisboa")
    ip = request.remote_addr
    if not check_rate_limit(ip):
        return jsonify({"error": "Rate limit exceeded"}), 429
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city)}&count=1&language=pt&format=json"
        geo_req = urllib.request.Request(geo_url, headers={"User-Agent": "PrimalForce/1.0"})
        with urllib.request.urlopen(geo_req, timeout=8) as r:
            geo = json.loads(r.read())
        if not geo.get("results"):
            return jsonify({"error": "City not found"}), 404
        lat = geo["results"][0]["latitude"]
        lon = geo["results"][0]["longitude"]
        name = geo["results"][0]["name"]
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto"
        weather_req = urllib.request.Request(weather_url, headers={"User-Agent": "PrimalForce/1.0"})
        with urllib.request.urlopen(weather_req, timeout=8) as r:
            wd = json.loads(r.read())
        c = wd["current"]
        descricoes = {
            0: "céu limpo", 1: "céu limpo", 2: "parcialmente nublado", 3: "nublado",
            45: "nevoeiro", 48: "nevoeiro", 51: "chuvisco", 53: "chuvisco", 55: "chuvisco",
            61: "chuva", 63: "chuva", 65: "chuva forte", 71: "neve", 73: "neve", 75: "neve",
            80: "aguaceiros", 81: "aguaceiros", 82: "aguaceiros", 95: "trovoada", 96: "trovoada", 99: "trovoada"
        }
        desc = descricoes.get(c["weather_code"], "tempo variável")
        return jsonify({
            "city": name,
            "description": desc,
            "temperature": c["temperature_2m"],
            "humidity": c["relative_humidity_2m"],
            "wind": c["wind_speed_10m"]
        })
    except Exception:
        return jsonify({"error": "Weather service unavailable"}), 502

@app.route('/news', methods=['GET'])
def news():
    ip = request.remote_addr
    if not check_rate_limit(ip):
        return jsonify({"error": "Rate limit exceeded"}), 429
    tema = request.args.get("topic", None)
    try:
        url = (f"https://news.google.com/rss/search?q={urllib.parse.quote(tema)}&hl=pt-PT&gl=PT&ceid=PT:pt"
               if tema else "https://feeds.feedburner.com/PublicoRSS")
        req = urllib.request.Request(url, headers={"User-Agent": "PrimalForce/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            texto = r.read().decode("utf-8", errors="replace")
        doc = re.findall(r'<title><!\[CDATA\[(.*?)\]\]></title>', texto)
        if not doc:
            doc = re.findall(r'<title>(.*?)</title>', texto)
        titulos = [t.strip() for t in doc[1:4] if t.strip()]
        return jsonify({"headlines": titulos})
    except Exception:
        return jsonify({"error": "News service unavailable"}), 502

@app.route('/tts', methods=['POST'])
def tts():
    import asyncio
    dados = request.get_json(silent=True) or {}
    texto = dados.get('texto', '')
    voz = dados.get('voz', 'pt-PT-DuarteNeural')
    rate = dados.get('rate', '-15%')
    if not texto:
        return jsonify({"erro": "Texto em falta"}), 400
    texto = re.sub(r'\*[^*]*\*', '', texto)
    texto = re.sub(r'["""\'\u0060]', '', texto)
    texto = re.sub(r'\s+', ' ', texto).strip()
    if len(texto) > 400:
        fim = -1
        for punct in [". ", "! ", "? ", "…"]:
            idx = texto.find(punct, 400)
            if idx != -1 and (fim == -1 or idx < fim):
                fim = idx
        if fim != -1:
            texto = texto[:fim + 1]
    try:
        import edge_tts
        buffer = io.BytesIO()
        async def stream_para_buffer():
            comunicador = edge_tts.Communicate(texto, voz, rate=rate)
            async for chunk in comunicador.stream():
                if chunk["type"] == "audio":
                    buffer.write(chunk["data"])
        asyncio.run(stream_para_buffer())
    except Exception:
        return jsonify({"erro": "TTS service unavailable"}), 500
    return Response(buffer.getvalue(), mimetype="audio/mpeg", status=200)

# ============ MODO GUARDIÃO — DISTRIBUIÇÃO DE PODERES ============

GUARDIAN_FILE = os.path.join(BASE_DIR, "guardian_data.json")
_guardian_lock = threading.Lock()

VALID_ROBOTS = [
    "rex", "spike", "tri", "pluma", "nuck", "bolha",
    "anka", "crista", "blitz", "testa", "mare", "garra",
    "brisa", "vela", "fin", "ninho", "sol", "frill", "abismo", "alado"
]

def _carregar_guardian():
    try:
        with open(GUARDIAN_FILE, "r", encoding="utf-8") as f:
            dados = json.load(f)
        if "assignments" not in dados:
            dados["assignments"] = {}
        return dados
    except Exception:
        return {"guardianName": "Guardião", "assignments": {}}

def _guardar_guardian(dados):
    with open(GUARDIAN_FILE, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

def _limpar_expiradas(dados):
    """Devolve à Morphin Grid os robôs cuja pessoa parou de falar."""
    agora = time.time()
    mudou = False
    for rid in list(dados["assignments"].keys()):
        a = dados["assignments"][rid]
        timeout_s = a.get("timeoutMinutes", 30) * 60
        ultima = a.get("lastMessage") or a.get("assignedAt", agora)
        if agora - ultima > timeout_s:
            del dados["assignments"][rid]
            mudou = True
    if mudou:
        _guardar_guardian(dados)
    return dados

def _serializar_assignments(dados):
    agora = time.time()
    out = []
    for rid, a in dados["assignments"].items():
        timeout_s = a.get("timeoutMinutes", 30) * 60
        ultima = a.get("lastMessage") or a.get("assignedAt", agora)
        out.append({
            "robot": rid,
            "person": a.get("person", ""),
            "code": a.get("code", ""),
            "assignedAt": a.get("assignedAt"),
            "lastMessage": a.get("lastMessage"),
            "lastSeen": a.get("lastSeen"),
            "timeoutMinutes": a.get("timeoutMinutes", 30),
            "online": (agora - (a.get("lastSeen") or 0)) < 60,
            "expiresAt": ultima + timeout_s
        })
    return out

@app.route('/distribute', methods=['POST'])
def distribute():
    if not check_rate_limit(request.remote_addr):
        return jsonify({"error": "Rate limit exceeded"}), 429
    d = request.get_json(silent=True) or {}
    rid = (d.get("robot") or "").lower().strip()
    person = (d.get("person") or "").strip()[:40]
    try:
        timeout = min(480, max(5, int(d.get("timeoutMinutes", 30))))
    except (TypeError, ValueError):
        timeout = 30
    if rid not in VALID_ROBOTS:
        return jsonify({"error": "Robô desconhecido"}), 400
    if not person:
        return jsonify({"error": "Nome da pessoa obrigatório"}), 400
    with _guardian_lock:
        dados = _limpar_expiradas(_carregar_guardian())
        if rid in dados["assignments"]:
            return jsonify({"error": "Esse robô já está em missão"}), 409
        code = secrets.token_urlsafe(6)
        agora = time.time()
        dados["assignments"][rid] = {
            "code": code,
            "person": person,
            "assignedAt": agora,
            "lastMessage": agora,
            "lastSeen": agora,
            "timeoutMinutes": timeout
        }
        if d.get("guardianName"):
            dados["guardianName"] = str(d["guardianName"])[:40]
        _guardar_guardian(dados)
    url = request.host_url.rstrip("/") + "/ranger.html?code=" + code
    return jsonify({"ok": True, "code": code, "url": url, "robot": rid, "person": person})

@app.route('/assignments', methods=['GET'])
def assignments():
    if not check_rate_limit(request.remote_addr):
        return jsonify({"error": "Rate limit exceeded"}), 429
    with _guardian_lock:
        dados = _limpar_expiradas(_carregar_guardian())
    return jsonify({"guardianName": dados.get("guardianName", "Guardião"), "assignments": _serializar_assignments(dados)})

@app.route('/revoke', methods=['POST'])
def revoke():
    if not check_rate_limit(request.remote_addr):
        return jsonify({"error": "Rate limit exceeded"}), 429
    d = request.get_json(silent=True) or {}
    rid = (d.get("robot") or "").lower().strip()
    with _guardian_lock:
        dados = _carregar_guardian()
        if rid not in dados["assignments"]:
            return jsonify({"error": "Esse robô não está em missão"}), 404
        del dados["assignments"][rid]
        _guardar_guardian(dados)
    return jsonify({"ok": True, "robot": rid})

@app.route('/robot-status', methods=['GET'])
def robot_status():
    if not check_rate_limit(request.remote_addr):
        return jsonify({"error": "Rate limit exceeded"}), 429
    with _guardian_lock:
        dados = _limpar_expiradas(_carregar_guardian())
    status = {}
    for a in _serializar_assignments(dados):
        status[a["robot"]] = {"onMission": True, "person": a["person"], "online": a["online"]}
    return jsonify({"status": status})

@app.route('/ranger/info', methods=['GET'])
def ranger_info():
    code = request.args.get("code", "")
    if not code:
        return jsonify({"error": "Código em falta"}), 400
    with _guardian_lock:
        dados = _limpar_expiradas(_carregar_guardian())
    for rid, a in dados["assignments"].items():
        if a.get("code") == code:
            info = PRIMAL_ROBOT_INFO.get(rid, {})
            return jsonify({
                "ok": True,
                "robot": rid,
                "person": a.get("person", ""),
                "guardianName": dados.get("guardianName", "Guardião"),
                "nome": info.get("nome", rid),
                "cor": info.get("cor", "#FFD700"),
                "ranger": info.get("ranger", ""),
                "dino": info.get("dino", ""),
                "imagem": info.get("imagem", ""),
                "frase": info.get("frase", ""),
                "lastMessage": a.get("lastMessage"),
                "timeoutMinutes": a.get("timeoutMinutes", 30)
            })
    return jsonify({"error": "Link inválido ou robô já devolvido à Morphin Grid"}), 404

@app.route('/ranger/ping', methods=['POST'])
def ranger_ping():
    d = request.get_json(silent=True) or {}
    code = d.get("code", "")
    if not code:
        return jsonify({"error": "Código em falta"}), 400
    agora = time.time()
    with _guardian_lock:
        dados = _limpar_expiradas(_carregar_guardian())
        for rid, a in dados["assignments"].items():
            if a.get("code") == code:
                a["lastSeen"] = agora
                _guardar_guardian(dados)
                timeout_s = a.get("timeoutMinutes", 30) * 60
                ultima = a.get("lastMessage") or a.get("assignedAt", agora)
                return jsonify({"ok": True, "active": True, "expiresAt": ultima + timeout_s})
    return jsonify({"ok": True, "active": False})

@app.route('/ranger/activity', methods=['POST'])
def ranger_activity():
    d = request.get_json(silent=True) or {}
    code = d.get("code", "")
    if not code:
        return jsonify({"error": "Código em falta"}), 400
    agora = time.time()
    with _guardian_lock:
        dados = _carregar_guardian()
        for rid, a in dados["assignments"].items():
            if a.get("code") == code:
                a["lastMessage"] = agora
                a["lastSeen"] = agora
                _guardar_guardian(dados)
                return jsonify({"ok": True, "active": True, "expiresAt": agora + a.get("timeoutMinutes", 30) * 60})
    return jsonify({"ok": True, "active": False})

# Informação estática dos robôs para /ranger/info (evita importar JS no servidor)
PRIMAL_ROBOT_INFO = {
    "rex": {"nome": "Rex", "cor": "#C62828", "ranger": "Roro", "dino": "T-Rex", "imagem": "assets/img/rex.png", "frase": "Vamos rugir mais alto que eles!"},
    "spike": {"nome": "Spike", "cor": "#212121", "ranger": "Mar", "dino": "Estegossauro", "imagem": "assets/img/spike.png", "frase": "Isto vai doer... para eles."},
    "tri": {"nome": "Tri", "cor": "#1565C0", "ranger": "Marc", "dino": "Triceratops", "imagem": "assets/img/tri.png", "frase": "Análise completa."},
    "pluma": {"nome": "Pluma", "cor": "#F9A825", "ranger": "Vido", "dino": "Pterodáctilo", "imagem": "assets/img/pluma.png", "frase": "Ainda aqui. Sempre aqui."},
    "nuck": {"nome": "Nuck", "cor": "#546E7A", "ranger": "Zenowing", "dino": "Titanossauro", "imagem": "assets/img/nuck.png", "frase": "(som grave de confirmação)"},
    "bolha": {"nome": "Bolha", "cor": "#CE93D8", "ranger": "Mira", "dino": "Plesiossauro", "imagem": "assets/img/bolha.png", "frase": "Coordenadas enviadas! Boa sorte lá fora!"},
    "anka": {"nome": "Anka", "cor": "#E91E63", "ranger": "Rosa", "dino": "Anquilossauro", "imagem": "assets/img/anka.png", "frase": "Ninguém passa por mim!"},
    "crista": {"nome": "Crista", "cor": "#2E7D32", "ranger": "Verde", "dino": "Parassauro", "imagem": "assets/img/crista.png", "frase": "Boas vibrações, vamos a isto!"},
    "blitz": {"nome": "Blitz", "cor": "#E65100", "ranger": "Laranja", "dino": "Velociraptor", "imagem": "assets/img/blitz.png", "frase": "Já chegámos? Ah, espera, já ganhei."},
    "testa": {"nome": "Testa", "cor": "#424242", "ranger": "Grafite", "dino": "Paquicefalossauro", "imagem": "assets/img/testa.png", "frase": "Já experimentei. Funciona."},
    "mare": {"nome": "Maré", "cor": "#00838F", "ranger": "Ciano", "dino": "Mosassauro", "imagem": "assets/img/mare.png", "frase": "A maré vira sempre a nosso favor."},
    "garra": {"nome": "Garra", "cor": "#B71C1C", "ranger": "Vermelho Escuro", "dino": "Alossauro", "imagem": "assets/img/garra.png", "frase": "Deixem a fera trabalhar."},
    "brisa": {"nome": "Brisa", "cor": "#00897B", "ranger": "Aqua", "dino": "Tapejara", "imagem": "assets/img/brisa.png", "frase": "Vi tudo lá de cima. Querem saber?"},
    "vela": {"nome": "Vela", "cor": "#AD1457", "ranger": "Magenta", "dino": "Amargasaurus", "imagem": "assets/img/vela.png", "frase": "E agora... o momento que esperavam!"},
    "fin": {"nome": "Fin", "cor": "#4A148C", "ranger": "Roxo", "dino": "Espinossauro", "imagem": "assets/img/fin.png", "frase": "Chega de conversa."},
    "ninho": {"nome": "Ninho", "cor": "#7CB342", "ranger": "Verde Lima", "dino": "Oviraptor", "imagem": "assets/img/ninho.png", "frase": "Opa... isso não fui eu. Ou fui?"},
    "sol": {"nome": "Sol", "cor": "#795548", "ranger": "Castanho", "dino": "Dimetrodon", "imagem": "assets/img/sol.png", "frase": "Calma. Tudo tem o seu tempo."},
    "frill": {"nome": "Frill", "cor": "#FDD835", "ranger": "Amarelo", "dino": "Dilofossauro", "imagem": "assets/img/frill.png", "frase": "CUIDADO! ...ok, era só um inseto."},
    "abismo": {"nome": "Abismo", "cor": "#0D47A1", "ranger": "Azul Marinho", "dino": "Liopleurodon", "imagem": "assets/img/abismo.png", "frase": "As profundezas guardam segredos. Eu também."},
    "alado": {"nome": "Alado", "cor": "#ECEFF1", "ranger": "Branco", "dino": "Quetzalcoatlus", "imagem": "assets/img/alado.png", "frase": "Ao seu dispor, sempre."}
}

@app.route('/<path:filename>')
def serve_file(filename):
    if filename in ('index.html', 'sw.js', 'manifest.json'):
        resp = send_from_directory(BASE_DIR, filename, max_age=0)
        resp.headers.update(NO_CACHE)
        return resp
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
