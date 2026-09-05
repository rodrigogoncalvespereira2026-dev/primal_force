class RobotAI {
    constructor(nome, personalidade, objetivo, cor, suporte, frase, ranger, dino, voz) {
        this.nome = nome;
        this.personalidade = personalidade;
        this.objetivo = objetivo;
        this.cor = cor;
        this.suporte = suporte || "attack";
        this.frase = frase || "";
        this.ranger = ranger || "";
        this.dino = dino || "";
        this.vozConfig = voz || null;
        this.maxHistorico = 10;
        this.primalForce = null;
        this._filaRequisicoes = [];
        this._processandoFila = false;
    }

    _obterVoz() {
        if (this.vozConfig) return this.vozConfig;
        if (this.primalForce) {
            const dados = this.primalForce[this.nome.toLowerCase()];
            if (dados && dados.voz) return dados.voz;
        }
        return { nome: "pt-PT-DuarteNeural", rate: "-15%", pitch: 0.9 };
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
                if (dados.choices && dados.choices[0] && dados.choices[0].message) {
                    return dados.choices[0].message.content;
                }
                throw new Error("Resposta da API sem conteúdo válido.");
            }
        }
        throw new Error(`Groq API: todos os modelos falharam (${ultimoErro.join(" | ") || "sem resposta"}).`);
    }

    async responde(mensagem) {
        this.extrairFactos(mensagem);
        this.adicionarHistorico("user", mensagem);

        const historico = this.carregarHistorico();
        const msgLower = mensagem.toLowerCase();
        let infoExtra = "";

        if (["tempo", "meteorologia", "temperatura", "chuva", "sol", "vento", "frio", "calor", "clima"].some(p => msgLower.includes(p))) {
            const palavras = msgLower.split(" ");
            const preposicoes = ["em", "no", "na", "para"];
            let cidade = "Lisboa";
            for (let i = 0; i < palavras.length; i++) {
                if (preposicoes.includes(palavras[i]) && i + 1 < palavras.length) {
                    cidade = palavras[i + 1].charAt(0).toUpperCase() + palavras[i + 1].slice(1);
                    break;
                }
            }
            const tempo = await this.obterTempo(cidade);
            if (tempo) infoExtra += `\nTempo: ${tempo}`;
        }

        if (["notícia", "noticias", "novidades", "aconteceu", "últimas", "ultimas", "news"].some(p => msgLower.includes(p))) {
            let tema = null;
            const palavrasChave = ["sobre", "de", "acerca"];
            const palavras = msgLower.split(" ");
            for (let i = 0; i < palavras.length; i++) {
                if (palavrasChave.includes(palavras[i]) && i + 1 < palavras.length) {
                    tema = palavras[i + 1];
                    break;
                }
            }
            const noticias = await this.obterNoticias(tema);
            if (noticias) infoExtra += `\n${noticias}`;
        }

        const factos = this.obterFactos();
        const systemPrompt = [
            this.obterDefinicao(),
            this.primalForce ? this.obterContextoEquipa() : "",
            "Responde SEMPRE em português, de forma muito curta e conversável: no máximo 1 a 3 frases.",
            "NUNCA te apresentes nem descrevas quem és por iniciativa própria — só se o utilizador pedir explicitamente.",
            "Usa a tua frase icónica de vez em quando, de forma natural.",
            `Tu és o ${this.nome}, o robô companheiro do Ranger ${this.ranger}. O teu dinossauro é ${this.dino}. A tua função é ${this.suporte}.`,
            factos ? `Factos do utilizador: ${factos}` : "",
            infoExtra ? `Info: ${infoExtra}` : ""
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
                body: JSON.stringify({ texto: textoVoz, voz: this._obterVoz().nome, rate: this._obterVoz().rate })
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
            utterance.pitch = this._obterVoz().pitch || 0.9;
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

    // === FACTS / LEARNING ===
    obterChaveFactos() { return `factos_robot_${this.nome.toLowerCase()}`; }

    carregarFactos() {
        try {
            const dados = localStorage.getItem(this.obterChaveFactos());
            return dados ? JSON.parse(dados) : [];
        } catch (e) { return []; }
    }

    guardarFactos(factos) {
        try { localStorage.setItem(this.obterChaveFactos(), JSON.stringify(factos)); } catch (e) {}
    }

    extrairFactos(texto) {
        const keywords = ["chamo", "nome é", "tenho", "anos", "trabalho", "gosto", "moro", "vivo", "sou", "estudo", "adoro", "odeio", "prefiro"];
        const textoLower = texto.toLowerCase();
        for (const keyword of keywords) {
            if (textoLower.includes(keyword)) {
                const factos = this.carregarFactos();
                const novo = { texto, data: new Date().toISOString().split("T")[0] };
                if (!factos.some(f => f.texto === texto)) {
                    factos.push(novo);
                    this.guardarFactos(factos);
                }
                break;
            }
        }
    }

    obterFactos() {
        const factos = this.carregarFactos();
        return factos.length ? factos.map(f => f.texto).join("; ") : null;
    }

    // === WEATHER ===
    async obterTempo(cidade = "Lisboa") {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const resp = await fetch(`/weather?city=${encodeURIComponent(cidade)}`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!resp.ok) return null;
            const d = await resp.json();
            if (d.error) return null;
            return `Em ${d.city} está ${d.description}. ${d.temperature}°C, ${d.humidity}% de humidade, vento ${d.wind} km/h.`;
        } catch { return null; }
    }

    // === NEWS ===
    async obterNoticias(tema = null) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const url = tema ? `/news?topic=${encodeURIComponent(tema)}` : "/news";
            const resp = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!resp.ok) return null;
            const d = await resp.json();
            if (!d.headlines || !d.headlines.length) return null;
            return "Últimas notícias:\n" + d.headlines.map((t, i) => `${i + 1}. ${t}`).join("\n");
        } catch { return null; }
    }

    // === SAUDAÇÃO DIÁRIA ===
    saudacaoDiaria() {
        const h = new Date().getHours();
        let periodo;
        if (h < 6) periodo = "noite madrugada";
        else if (h < 12) periodo = "manhã";
        else if (h < 18) periodo = "tarde";
        else periodo = "noite";
        const saudacoes = {
            attack: [`Bom ${periodo}! A batalha começa agora!`, `Pronto para a luta nesta ${periodo}?`],
            shield: [`Bom ${periodo}! Estou aqui para te proteger.`, `Descansa, eu cuido de tudo nesta ${periodo}.`],
            scan: [`Bom ${periodo}! Analisei os dados — tudo está otimizado.`, `Bom ${periodo}! Tenho informações importantes para ti.`],
            utility: [`Bom ${periodo}! O que precisas hoje?`, `Bom ${periodo}! Vamos organizar o teu dia!`],
            alert: [`Bom ${periodo}! Fica atento ao que vou dizer!`, `Bom ${periodo}!atenção, tenho um aviso!`]
        };
        const lista = saudacoes[this.suporte] || saudacoes.utility;
        return lista[Math.floor(Math.random() * lista.length)];
    }

    // === FACTOS DOS DINOSSAUROS ===
    factoDino() {
        const factos = {
            t_rex: "O T-Rex tinha uma mordida de 8.000 kg de pressão — mais forte que qualquer animal atual!",
            triceratops: "O Triceratops tinha 3 chifres e usava-os para defender-se de predadores.",
            estegossauro: "O Estegossauro tinha placas nas costas que regulavam a temperatura corporal.",
            pterodactilo: "O Pterodactilo não era um dinossauro — era um réptil voador!",
            velociraptor: "O Velociraptor era do tamanho de um peru, mas muito mais inteligente.",
            braquiossauro: "O Braquiossauro media 25 metros e pesava 80 toneladas!",
            anquilossauro: "O Anquilossaurus tinha uma cauda blindada como um_porco-espinho gigante.",
            espinossauro: "O Espinossauro era o maior predador — maior que o T-Rex!",
            parassaurolofo: "O Parassaurolofo tinha um tubo na cabeça que usava para fazer som.",
            carnotassauro: "O Carnotauro tinha pequenos chifres e corria a 60 km/h!",
            talaruro: "O Talarauro era um dinossauro blindado do deserto.",
            dilofossauro: "O Dilofossauro cuszia veneno — sim, como no Jurassic Park!",
            dimetrodonte: "O Dimetrodonte vivia antes dos dinossauros — há 290 milhões de anos!",
            smilodonte: "O Smilodonte (tigre-de-presas) caçava mastodontes!",
            megalodonte: "O Megalodonte tinha 18 metros — 3x maior que um tubarão-branco!",
            espino_deluxe: "O Espino Deluxe combina aquática e terrestre — o mais versátil!",
            ptero_ice: "O Pterodactilo de gelo podia voar a 100 km/h em tempestades!",
            raptor_sonico: "O Raptor Sónico corria a velocidades impossíveis!",
            rex_primal: "O Rex Primal é a evolução máxima do T-Rex — puro poder!",
            tri_supreme: "O Triceratops Supremo é o defensor mais resistente de todos os tempos!"
        };
        return factos[this.dino] || "Os dinossauros reinaram a Terra por 165 milhões de anos!";
    }

    // === CITAS MOTIVACIONAIS ===
    fraseMotivacional() {
        const frases = {
            attack: ["Não pares até ganhar!", "A vitória é para os corajosos!", "Força total — nada nos para!"],
            shield: ["A proteção vem da coragem.", "Defender é mais forte que atacar.", "Estou aqui — não ficas sozinho!"],
            scan: ["A informação é poder.", "Conhece o teu inimigo antes da batalha.", "Dados precisos, ações certas."],
            utility: ["Organização é a chave do sucesso.", "Um passo de cada vez.", "Vamos resolver isso juntos!"],
            alert: ["Atenção é o primeiro passo.", "Quem avisa, amigo é!", "Fica atento — o perigo está perto!"]
        };
        const lista = frases[this.suporte] || frases.utility;
        return lista[Math.floor(Math.random() * lista.length)];
    }

    // === SISTEMA DE PODER/LEVEL ===
    obterChavePoder() { return `primal_poder_${this.robotId}`; }

    carregarPoder() {
        try {
            const dados = localStorage.getItem(this.obterChavePoder());
            return dados ? JSON.parse(dados) : { xp: 0, level: 1, interacoes: 0 };
        } catch { return { xp: 0, level: 1, interacoes: 0 }; }
    }

    guardarPoder(dados) {
        try { localStorage.setItem(this.obterChavePoder(), JSON.stringify(dados)); } catch {}
    }

    ganharXP(amount = 10) {
        const p = this.carregarPoder();
        p.xp += amount;
        p.interacoes += 1;
        const xpNecessario = p.level * 50;
        let msg = null;
        if (p.xp >= xpNecessario) {
            p.level += 1;
            p.xp = 0;
            msg = `🎉 Level Up! Agora sou nível ${p.level}!`;
        }
        this.guardarPoder(p);
        return msg;
    }

    // === BATALHA ENTRE ROBÔS ===
    async batalharCom(outroRobot) {
        const p1 = this.carregarPoder();
        const p2 = outroRobot.carregarPoder();
        const forca1 = p1.level * 10 + Math.floor(Math.random() * 20);
        const forca2 = p2.level * 10 + Math.floor(Math.random() * 20);
        const venceu = forca1 >= forca2;
        const historico = [
            { participante: this.nome, level: p1.level, forca: forca1 },
            { participante: outroRobot.nome, level: p2.level, forca: forca2 }
        ];
        const contexto = `Batalha entre ${this.nome} (Nv.${p1.level}, Força: ${forca1}) e ${outroRobot.nome} (Nv.${p2.level}, Força: ${forca2}).`;
        const prompt = venceu
            ? `${this.nome} venceu a batalha contra ${outroRobot.nome}! Narra a batalha de forma épica e dramática em português.`
            : `${outroRobot.nome} venceu a batalha contra ${this.nome}! Narra a batalha de forma épica e dramática em português.`;
        const narrativa = await this._chamarGroq([
            { role: "system", content: this.obterDefinicao() },
            { role: "user", content: contexto + "\n\n" + prompt }
        ]);
        return {
            vencedor: venceu ? this : outroRobot,
            perdedor: venceu ? outroRobot : this,
            forca1, forca2,
            narrativa,
            historico
        };
    }

    // === AVENTURA INTERATIVA ===
    async aventura(tema) {
        const prompt = `Cria uma aventura interativa de escolha para o utilizador. Tema: ${tema || "aventura nos Power Rangers Primal Force"}. 
        Dá 2 opções de escolha no final (label e descrição). Responde em JSON: { "cena": "texto narrativo", "opcoes": [{ "label": "Opção A", "descricao": "..." }, { "label": "Opção B", "descricao": "..." }] }.
        Se for o fim da história, responde: { "cena": "texto final", "opcoes": [] }.`;
        const textoRaw = await this._chamarGroq([
            { role: "system", content: this.obterDefinicao() + "\n" + prompt },
            { role: "user", content: "Começa a aventura!" }
        ]);
        try {
            const texto = textoRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(texto);
        } catch {
            return { cena: dados.texto, opcoes: [] };
        }
    }

    async continuarAventura(historico, escolha) {
        const prompt = `Continua esta aventura interativa. O utilizador escolheu: "${escolha}". 
        Dá 2 opções de escolha no final. Responde em JSON: { "cena": "texto narrativo", "opcoes": [{ "label": "Opção A", "descricao": "..." }, { "label": "Opção B", "descricao": "..." }] }.
        Se for o fim, responde: { "cena": "texto final", "opcoes": [] }.`;
        const messages = [
            { role: "system", content: this.obterDefinicao() + "\n" + prompt },
            ...historico,
            { role: "user", content: `Escolhi: ${escolha}` }
        ];
        const textoRaw = await this._chamarGroq(messages);
        try {
            const texto = textoRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(texto);
        } catch {
            return { cena: dados.texto, opcoes: [] };
        }
    }
}
