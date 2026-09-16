/**
 * Monitorização automática do Diário da República (RSS oficial INCM).
 * Sem dependências extra. Não altera o esquema da base de dados.
 */
const fs = require('fs');
const path = require('path');

const FEEDS = [
  'https://files.diariodarepublica.pt/rss/serie1-html.xml',
  'https://files.diariodarepublica.pt/rss/serie2-html.xml',
];

const FILTROS = [
  { area: 'nacionalidade', termos: ['nacionalidade', 'naturalizacao', 'lei da nacionalidade', '37/81', '237-a/2006', 'registos centrais'] },
  { area: 'herancas', termos: ['heranca', 'sucessoes', 'habilitacao de herdeiros', 'balcao das herancas', 'inventario notarial'] },
  { area: 'registos', termos: ['registo civil', 'registo predial', 'registo comercial', 'rcbe', 'beneficiario efetivo', 'conservatoria', 'codigo do notariado', 'instituto dos registos', '131/95', '89/2017', 'identificacao civil'] },
  { area: 'migracao', termos: ['aima', 'cidadaos estrangeiros', 'imigracao', 'asilo', 'autorizacao de residencia', 'titulo de residencia', '23/2007'] },
  { area: 'justica', termos: ['processo civil', 'agente de execucao', 'acao executiva'] },
  { area: 'profissional', termos: ['solicitador', 'osae', 'ordem dos solicitadores'] },
];

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'legislacao-atualizacoes.json');
const MAX_ITENS = 80;
const INTERVALO_MS = 60 * 60 * 1000;

let _timer = null;
let _aCorrer = false;

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function stripXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function descodificarRss(buf) {
  const utf8 = buf.toString('utf8');
  if (utf8.includes('Diário') || utf8.includes('Decreto-Lei') || utf8.includes('Portaria')) return utf8;
  return buf.toString('latin1');
}

function parseItensRss(xml) {
  return xml.split(/<item[\s>]/i).slice(1).map((bloco) => {
    const corpo = bloco.split(/<\/item>/i)[0] || '';
    const titulo = stripXml((corpo.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
    const url = stripXml((corpo.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1]);
    const resumo = stripXml((corpo.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || [])[1]);
    const dataMatch = titulo.match(/(\d{4}-\d{2}-\d{2})/);
    const diplomaMatch = titulo.match(/^(.+?)\s+-\s+Diário/i) || titulo.match(/^(.+?)\s{2,}/);
    const serie = /s[eé]rie\s*ii\b/i.test(titulo) ? 'II' : 'I';
    return {
      titulo,
      url,
      resumo,
      dataPublicacao: dataMatch ? dataMatch[1] : null,
      diploma: diplomaMatch ? diplomaMatch[1].trim() : titulo,
      serie,
    };
  }).filter((item) => item.titulo && item.url);
}

function classificar(item) {
  const texto = normalizar(`${item.titulo} ${item.resumo} ${item.diploma}`);
  for (const filtro of FILTROS) {
    if (filtro.termos.some((termo) => texto.includes(normalizar(termo)))) {
      return filtro.area;
    }
  }
  return null;
}

function estadoVazio() {
  return {
    versao: 1,
    ultimaVerificacao: null,
    fonteOficial: 'https://diariodarepublica.pt/dr/home',
    origem: 'rss-dre',
    areasVigiadas: FILTROS.map((f) => f.area),
    atualizacoes: [],
  };
}

function lerEstado(ficheiro) {
  const alvo = ficheiro || DATA_FILE;
  try {
    if (!fs.existsSync(alvo)) return estadoVazio();
    const dados = JSON.parse(fs.readFileSync(alvo, 'utf8'));
    if (!dados || typeof dados !== 'object') return estadoVazio();
    if (!Array.isArray(dados.atualizacoes)) dados.atualizacoes = [];
    return dados;
  } catch {
    return estadoVazio();
  }
}

function gravarEstado(estado, ficheiro) {
  const alvo = ficheiro || DATA_FILE;
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.writeFileSync(alvo, JSON.stringify(estado, null, 2), 'utf8');
}

async function obterFeed(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SistemaLegal-MonitorLegislacao/1.0' },
  });
  if (!res.ok) throw new Error(`DRE RSS HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return parseItensRss(descodificarRss(buf));
}

function impactoPorArea(area) {
  const mapa = {
    nacionalidade: 'Pode afetar processos de nacionalidade e minutas associadas.',
    herancas: 'Pode afetar habilitações, partilhas e o Balcão das Heranças.',
    registos: 'Pode afetar conservatórias, predial, comercial ou RCBE.',
    migracao: 'Pode afetar processos AIMA e títulos de residência.',
    justica: 'Pode afetar execuções e prazos processuais.',
    profissional: 'Pode afetar o estatuto profissional e deveres da solicitadoria.',
  };
  return mapa[area] || 'Relevante para a solicitadoria. Confirmar o texto no DRE.';
}

async function verificarAgora(opcoes = {}) {
  const ficheiro = opcoes.outFile || DATA_FILE;
  const anterior = lerEstado(ficheiro);
  const vistos = new Set((anterior.atualizacoes || []).map((a) => a.url).filter(Boolean));
  const brutos = [];
  for (const feed of FEEDS) {
    const itens = await obterFeed(feed);
    brutos.push(...itens);
  }

  const novos = [];
  const relevantes = [];
  const unicos = new Map();
  for (const item of brutos) {
    if (unicos.has(item.url)) continue;
    unicos.set(item.url, item);
    const area = classificar(item);
    if (!area) continue;
    const atualizacao = {
      id: `dre-${Buffer.from(item.url).toString('hex').slice(-12)}`,
      area,
      titulo: item.titulo,
      diploma: item.diploma,
      resumo: item.resumo,
      impacto: impactoPorArea(area),
      url: item.url,
      dataPublicacao: item.dataPublicacao,
      serie: item.serie || 'I',
    };
    relevantes.push(atualizacao);
    if (!vistos.has(item.url)) novos.push(atualizacao);
  }

  const fundidos = [...relevantes, ...(anterior.atualizacoes || []).filter((a) => !unicos.has(a.url))];
  const estado = {
    ...estadoVazio(),
    ultimaVerificacao: new Date().toISOString(),
    atualizacoes: fundidos.slice(0, MAX_ITENS),
  };

  if (opcoes.persistir !== false) gravarEstado(estado, ficheiro);

  if (opcoes.enviarEmail !== false && novos.length) {
    try {
      const emailService = require('./email');
      if (typeof emailService.sendLegislacaoDigest === 'function') {
        await emailService.sendLegislacaoDigest(novos);
      }
    } catch (err) {
      console.warn('[legislacao] Email de alerta não enviado:', err.message);
    }
  }

  return { estado, novos, totalRelevantes: relevantes.length };
}

function iniciarAgendamento() {
  if (_timer) return;
  const correr = async () => {
    if (_aCorrer) return;
    _aCorrer = true;
    try {
      const resultado = await verificarAgora();
      console.log(`[legislacao] DRE verificado. Relevantes: ${resultado.totalRelevantes}. Novos: ${resultado.novos.length}.`);
    } catch (err) {
      console.warn('[legislacao] Falha na verificação automática:', err.message);
    } finally {
      _aCorrer = false;
    }
  };
  setTimeout(correr, 20 * 1000);
  _timer = setInterval(correr, INTERVALO_MS);
  if (typeof _timer.unref === 'function') _timer.unref();
}

async function mainCli() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outFile = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : DATA_FILE;
  const resultado = await verificarAgora({
    outFile,
    persistir: true,
    enviarEmail: args.includes('--email'),
  });
  process.stdout.write(JSON.stringify({
    ok: true,
    ficheiro: outFile,
    ultimaVerificacao: resultado.estado.ultimaVerificacao,
    relevantes: resultado.totalRelevantes,
    novos: resultado.novos.length,
  }) + '\n');
}

if (require.main === module) {
  mainCli().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = {
  verificarAgora,
  iniciarAgendamento,
  lerEstado,
  DATA_FILE,
};
