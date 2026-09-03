import os
import io
import json
import urllib.request
from flask import Flask, Response, jsonify, request, send_from_directory

app = Flask(__name__, static_folder=None)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

NO_CACHE = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}

@app.route('/')
def index():
    resp = send_from_directory(BASE_DIR, 'index.html', max_age=0)
    resp.headers.update(NO_CACHE)
    return resp

@app.route('/chat', methods=['POST'])
def chat():
    dados = request.get_json(silent=True) or {}
    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY not configured"}), 500

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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/tts', methods=['POST'])
def tts():
    import asyncio
    import re
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
    except Exception as e:
        return jsonify({"erro": f"edge-tts falhou: {e}"}), 500

    return Response(buffer.getvalue(), mimetype="audio/mpeg"), 200

@app.route('/<path:filename>')
def serve_file(filename):
    if filename in ('index.html', 'sw.js', 'manifest.json'):
        resp = send_from_directory(BASE_DIR, filename, max_age=0)
        resp.headers.update(NO_CACHE)
        return resp
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
