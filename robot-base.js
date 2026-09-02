class RobotAI {
    constructor(nome, personalidade, objetivo, cor, suporte, frase, ranger, dino) {
        this.nome = nome;
        this.personalidade = personalidade;
        this.objetivo = objetivo;
        this.cor = cor;
        this.suporte = suporte || "attack";
        this.frase = frase || "";
        this.ranger = ranger || "";
        this.dino = dino || "";
        this.maxHistorico = 10;
        this.primalForce = null;
        this._filaRequisicoes = [];
        this._processandoFila = false;
    }

    pararVozAtual() {
        if (window._sourceVozAtivo) {
            try { window._sourceVozAtivo.stop(); } catch (e) { console.warn("Erro ao parar áudio:", e); }
            window._sourceVozAtivo = null;
        }
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch (e) { console.warn("Erro ao cancelar síntese de fala:", e); }
        }
    }

    obterDefinicao() {
        const dados = this.primalForce ? this.primalForce[this.nome.toLowerCase()] || {} : {};
        const linhas = [
            `Nome: ${this.nome}.`,
            `Tipo de dinossauro: ${this.dino}.`,
            `Ranger associado: ${this.ranger}.`,
            `Função de combate: ${this.suporte}.`,
            `Frase icónica: "${this.frase}"`,
            `Objetivo: ${this.objetivo}`,
            `Personalidade: ${this.personalidade}`,
            "És um mini robô companheiro, criado pelos Mestres Morphin. Funcionas como um kwami: acordaste quando o teu Ranger certo te escolheu. Tens dupla função: combate (scanner, ataques, escudos, alerta) e personalidade (humor, traço forte).",
            "Quando te perguntarem quem és, o que és, qual é a tua função ou o teu Ranger, responde SEMPRE com base nestas definições. Não inventes."
        ];
        return linhas.filter(Boolean).join("\n");
    }

    obterContextoEquipa() {
        if (!this.primalForce) return "";
        const outros = Object.entries(this.primalForce)
            .filter(([chave]) => chave !== this.nome.toLowerCase())
            .map(([chave, r]) => `- ${r.nome} (${r.dino}, ${r.suporte}): ${r.tracoPrincipal}`)
            .join("\n");
        return [
            "Fazes parte dos Primal Force, com estes companheiros robô:",
            outros,
            "Fala deles com familiaridade quando o utilizador perguntar, como se fossem colegas teus."
        ].join("\n");
    }

    obterChaveHistorico() { return `historico_robot_${this.nome.toLowerCase()}`; }

    carregarHistorico() {
        try {
            const dados = localStorage.getItem(this.obterChaveHistorico());
            return dados ? JSON.parse(dados) : [];
        } catch (e) {
            console.warn("Erro ao carregar histórico:", e);
            return [];
        }
    }

    guardarHistorico(historico) {
        try {
            localStorage.setItem(this.obterChaveHistorico(), JSON.stringify(historico));
        } catch (e) {
            console.warn("Erro ao guardar histórico:", e);
        }
    }

    adicionarHistorico(role, content) {
        const historico = this.carregarHistorico();
        historico.push({ role, content });
        const maxBytes = 50000;
        while (historico.length > this.maxHistorico || JSON.stringify(historico).length > maxBytes) {
            historico.shift();
            if (historico.length === 0) break;
        }
        this.guardarHistorico(historico);
    }

    async _chamarGroq(messages) {
        return new Promise((resolve, reject) => {
            this._filaRequisicoes.push({
                funcao: async () => this._executarChamaGroq(messages),
                resolve,
                reject
            });
            this._processarFilaRequisicoes();
        });
    }

    async _processarFilaRequisicoes() {
        if (this._processandoFila || this._filaRequisicoes.length === 0) return;
        this._processandoFila = true;
        const requisicao = this._filaRequisicoes.shift();
        try {
            const resultado = await requisicao.funcao();
            requisicao.resolve(resultado);
        } catch (erro) {
            requisicao.reject(erro);
        }
        this._processandoFila = false;
        if (this._filaRequisicoes.length > 0) {
            setTimeout(() => this._processarFilaRequisicoes(), 100);
        }
    }

    async _executarChamaGroq(messages) {
        const modelos = Array.isArray(CONFIG.modelos) && CONFIG.modelos.length ? CONFIG.modelos : [CONFIG.model];
        const ultimoErro = [];

        for (const modelo of modelos) {
            for (let tentativa = 0; tentativa < 3; tentativa++) {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);

                const resposta = await fetch(CONFIG.chatEndpoint || "/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: modelo,
                        temperature: CONFIG.temperature,
                        messages
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (resposta.status === 429) {
                    const espera = (tentativa + 1) * 2000;
                    await new Promise(r => setTimeout(r, espera));
                    if (tentativa === 2) ultimoErro.push(`${modelo}: rate limit`);
                    continue;
                }

                if (!resposta.ok) {
                    if (tentativa === 2) ultimoErro.push(`${modelo}: ${resposta.status}`);
                    break;
                }

                const dados = await resposta.json();
                return dados.choices[0].message.content;
            }
        }
        throw new Error(`Groq API: todos os modelos falharam (${ultimoErro.join(" | ") || "sem resposta"}).`);
    }

    async responde(mensagem) {
        this.adicionarHistorico("user", mensagem);

        const historico = this.carregarHistorico();
        const systemPrompt = [
            this.obterDefinicao(),
            this.primalForce ? this.obterContextoEquipa() : "",
            "Responde SEMPRE em português, de forma muito curta e conversável: no máximo 1 a 3 frases.",
            "NUNCA te apresentes nem descrevas quem és por iniciativa própria — só se o utilizador pedir explicitamente.",
            "Usa a tua frase icónica de vez em quando, de forma natural.",
            `Tu és o ${this.nome}, o robô companheiro do Ranger ${this.ranger}. O teu dinossauro é ${this.dino}. A tua função é ${this.suporte}.`
        ].filter(Boolean).join("\n");

        const texto = await this._chamarGroq([
            { role: "system", content: systemPrompt },
            ...historico.slice(-6)
        ]);

        this.adicionarHistorico("assistant", texto);
        return texto;
    }

    async conversarCom(outrosRobots, historico = []) {
        const nomes = outrosRobots.map(r => r.nome).join(", ");
        const sistema = [
            this.obterDefinicao(),
            this.primalForce ? this.obterContextoEquipa() : "",
            `Conversa de grupo com: ${nomes}.`,
            "Estás numa conversa de grupo entre robôs companheiros, todos a falar ao mesmo tempo.",
            "REGRA FUNDAMENTAL: responde APENAS com a TUA própria fala, curta (1 a 3 frases), como se estivesses a falar em voz alta.",
            "NÃO escrevas o teu nome. NÃO escrevas os nomes dos outros. NÃO uses aspas. NÃO simules nem encenes as falas dos outros robôs.",
            "Apenas o texto que TU dizes, sem formatação."
        ].filter(Boolean).join("\n");

        const contexto = historico.slice(-8).map(m => m.content).join("\n");

        let texto = await this._chamarGroq([
            { role: "system", content: sistema },
            { role: "user", content: contexto ? "Histórico da conversa:\n" + contexto + "\n\nFala agora como tu, sem repetir nem encenar." : "Inicia a conversa com uma fala tua curta." }
        ]);

        texto = this._limparFala(texto);
        if (!texto) texto = "Hmm, eu não sei o que dizer agora...";
        this.adicionarHistorico("assistant", texto);
        return texto;
    }

    _limparFala(texto) {
        let t = String(texto || "").trim();
        t = t.replace(/^["']+/, "").replace(/["']+$/, "");
        t = t.replace(/^\s*(eu|eu\([^)]*\)|nome):\s*/i, "");
        t = t.replace(/^\[?[^:\]]{1,30}\]?:\s*/, "");
        const linhas = t.split("\n").map(l => l.trim()).filter(Boolean);
        t = linhas.join(" ");
        return t;
    }

    _dividirFrases(texto, max = 400) {
        const partes = [];
        const frases = texto.match(/[^.!?…]+[.!?…]+[\s]*|[^.!?…]+/g) || [];
        let atual = "";
        for (const f of frases) {
            const trim = f.trim();
            if (!trim) continue;
            if (atual && (atual + " " + trim).length > max) {
                partes.push(atual);
                atual = trim;
            } else {
                atual = atual ? atual + " " + trim : trim;
            }
        }
        if (atual) partes.push(atual);
        return partes.length ? partes : [texto];
    }

    async falar(texto) {
        if (!CONFIG.vozAtivada) return false;

        let textoVoz = String(texto || "")
            .replace(/\*[^*]*\*/g, "")
            .replace(/["""''`]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (!textoVoz) return false;

        if (CONFIG.vozAtivada) this.pararVozAtual();

        const partes = this._dividirFrases(textoVoz);
        for (const parte of partes) {
            const ok = await this._falarComServidor(parte);
            if (!ok) {
                const ok2 = await this._falarComBrowser(parte);
                if (!ok2) {
                    this._avisoVoz("Nenhuma fonte de voz disponível");
                    return false;
                }
            }
        }
        return true;
    }

    _avisoVoz(motivo) {
        try {
            if (window.adicionarSistema) {
                window.adicionarSistema("🔇 Voz indisponível: " + motivo);
            }
        } catch (e) {
            console.warn("Erro ao mostrar aviso de voz:", e);
        }
    }

    async _falarComServidor(textoVoz) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            const resposta = await fetch("/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({ texto: textoVoz, voz: "pt-PT-DuarteNeural", rate: "-15%" })
            });
            clearTimeout(timeout);

            if (!resposta.ok) return false;

            const arrayBuffer = await resposta.arrayBuffer();

            if (!window._audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return false;
                window._audioCtx = new AudioCtx();
            }

            if (window._audioCtx.state === "suspended") {
                await window._audioCtx.resume().catch(() => {});
            }

            const audioBuffer = await window._audioCtx.decodeAudioData(arrayBuffer);
            const source = window._audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(window._audioCtx.destination);
            window._sourceVozAtivo = source;
            source.start(0);

            return new Promise((resolve) => {
                let resolvido = false;
                source.onended = () => { if (!resolvido) { resolvido = true; resolve(true); } };
                setTimeout(() => { if (!resolvido) { resolvido = true; resolve(true); } }, audioBuffer.duration * 1000 + 1500);
            });
        } catch (e) {
            return false;
        }
    }

    async _falarComBrowser(textoVoz) {
        if (!("speechSynthesis" in window)) return false;

        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(textoVoz);
            utterance.lang = "pt-PT";
            utterance.rate = CONFIG.velocidadeVoz || 1.0;

            const idx = this._indiceVoz();
            utterance.pitch = 0.85 + (idx % 5) * 0.1;
            utterance.volume = 1.0;

            let resolvido = false;
            utterance.onend = () => { if (!resolvido) { resolvido = true; resolve(true); } };
            utterance.onerror = () => { if (!resolvido) { resolvido = true; resolve(false); } };

            window.speechSynthesis.speak(utterance);
            setTimeout(() => { if (!resolvido) { resolvido = true; resolve(true); } }, textoVoz.length * 100 + 1500);
        });
    }

    _indiceVoz() {
        let soma = 0;
        for (const c of this.nome) soma += c.charCodeAt(0);
        return soma;
    }
}
