import os
import io
import json
import re
import time
import urllib.request
import urllib.parse
from collections import defaultdict
from flask import Flask, Response, jsonify, request, send_from_directory

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

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

@app.route('/<path:filename>')
def serve_file(filename):
    if filename in ('index.html', 'sw.js', 'manifest.json'):
        resp = send_from_directory(BASE_DIR, filename, max_age=0)
        resp.headers.update(NO_CACHE)
        return resp
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
