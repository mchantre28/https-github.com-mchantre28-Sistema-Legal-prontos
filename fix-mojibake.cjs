const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'script.js');
let s = fs.readFileSync(filePath, 'utf8');

// RELATÃ"RIO → RELATÓRIO (Ã + qualquer aspas → Ó)
s = s.replace(/RELATÃ[\u201c\u201d"]RIO/g, 'RELATÓRIO');
// PRÃ"XIMOS → PRÓXIMOS
s = s.replace(/PRÃ[\u201c\u201d"]XIMOS/g, 'PRÓXIMOS');
// CÃ"DIGOS → CÓDIGOS
s = s.replace(/CÃ[\u201c\u201d"]DIGOS/g, 'CÓDIGOS');

// Ã  (Ã + espaço ou nbsp) → à
s = s.replace(/Ã\s+/g, 'à ');
// â€" / â€" (em dash quebrado) → —
s = s.replace(/â€[\u201c\u201d"]/g, '—');

// Palavras específicas
s = s.replace(/HERANÃ‡AS/g, 'HERANÇAS');
s = s.replace(/MIGRAÃ‡Ã•ES/g, 'MIGRAÇÕES');
s = s.replace(/MIGRAÃ‡ÃƒO/g, 'MIGRAÇÃO');
s = s.replace(/PROCURAÃ‡ÃƒO/g, 'PROCURAÇÃO');
s = s.replace(/DECLARAÃ‡ÃƒO/g, 'DECLARAÇÃO');
s = s.replace(/DECLARAÃ‡ÃƒO DE RESIDÃŠNCIA/g, 'DECLARAÇÃO DE RESIDÊNCIA');
s = s.replace(/TRIBUTÃ.RIA/g, 'TRIBUTÁRIA');
s = s.replace(/ANÃ.LISE/g, 'ANÁLISE');
s = s.replace(/ESTATÃ.STICO/g, 'ESTATÍSTICO');
s = s.replace(/GESTÃƒO/g, 'GESTÃO');
s = s.replace(/NÃƒO /g, 'NÃO ');
s = s.replace(/ATENÃ‡ÃƒO/g, 'ATENÇÃO');
s = s.replace(/AUTOMÃ.TICO/g, 'AUTOMÁTICO');
s = s.replace(/GENÃ.RICA/g, 'GENÉRICA');
s = s.replace(/ESPECÃ.FICA/g, 'ESPECÍFICA');
s = s.replace(/NOTIFICAÃ‡Ã•ES/g, 'NOTIFICAÇÕES');
s = s.replace(/HÃ.BRIDO/g, 'HÍBRIDO');
s = s.replace(/COMUNICAÃ‡ÃƒO/g, 'COMUNICAÇÃO');
s = s.replace(/VISUALIZAÃ‡ÃƒO/g, 'VISUALIZAÇÃO');
s = s.replace(/FUNÃ‡Ã•ES/g, 'FUNÇÕES');
s = s.replace(/SEÃ‡Ã•ES/g, 'SECÇÕES');
s = s.replace(/EDIÃ‡ÃƒO/g, 'EDIÇÃO');
s = s.replace(/ATUALIZAÃ‡ÃƒO/g, 'ATUALIZAÇÃO');
s = s.replace(/EXCLUSÃƒO/g, 'EXCLUSÃO');
s = s.replace(/EXECUÃ‡ÃƒO/g, 'EXECUÇÃO');
s = s.replace(/Ã.REAS/g, 'ÁREAS');
s = s.replace(/ESTÃ. /g, 'ESTÁ ');
s = s.replace(/VALIDAÃ‡Ã•ES/g, 'VALIDAÇÕES');
s = s.replace(/GERAÃ‡ÃƒO/g, 'GERAÇÃO');
s = s.replace(/SINCRONIZAÃ‡ÃƒO/g, 'SINCRONIZAÇÃO');
s = s.replace(/CALENDÃ.RIO/g, 'CALENDÁRIO');
s = s.replace(/FORÃ‡AR RENDERIZAÃ‡ÃƒO DOS Ã.CONES/g, 'FORÇAR RENDERIZAÇÃO DOS ÍCONES');
s = s.replace(/APÃS /g, 'APÓS ');
s = s.replace(/HERANÃ‡A EDITADA/g, 'HERANÇA EDITADA');

// Âº → º (ordinal)
s = s.replace(/Âº/g, 'º');
s = s.replace(/n\.Âº/g, 'n.º');

// Traço largo, bullet, reticências (mojibake)
s = s.replace(/â€[\u201c\u201d"]/g, '—');
s = s.replace(/â€¢/g, '•');
s = s.replace(/â€¦/g, '…');
s = s.replace(/â€'/g, '‑');
s = s.replace(/Wiâ€.Fi/g, 'Wi‑Fi');
fs.writeFileSync(filePath, s, 'utf8');
console.log('Mojibake corrigido.');
