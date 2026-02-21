/**
 * Script para criar as coleções Firestore (aparecem na consola após primeiro doc).
 * Executar na consola do browser (F12) após fazer login no Sistema Legal.
 * Garante que firebase e firestoreDb estão definidos no scope global.
 */
(async function seedFirestoreColecoes() {
  if (typeof firestoreDb === 'undefined') {
    console.error('firestoreDb não definido. Abra o Sistema Legal e faça login primeiro.');
    return;
  }
  const ts = new Date().toISOString();
  const colecoes = [
    { nome: 'tipos_de_processos', doc: { id: 'tp1', nome: 'Herança', descricao: 'Processo de heranças', ativo: true } },
    { nome: 'tipos_de_processos', doc: { id: 'tp2', nome: 'Migração', descricao: 'Processo de migração', ativo: true } },
    { nome: 'tipos_de_processos', doc: { id: 'tp3', nome: 'Registo', descricao: 'Processo de registos', ativo: true } },
    { nome: 'tipos_de_documentos', doc: { id: 'td1', nome: 'Certidão', tipoProcesso: 'herancas', ativo: true } },
    { nome: 'estados_de_processo', doc: { id: 'ep1', nome: 'Em análise', ordem: 1, ativo: true } },
    { nome: 'estados_de_processo', doc: { id: 'ep2', nome: 'Em curso', ordem: 2, ativo: true } },
    { nome: 'estados_de_processo', doc: { id: 'ep3', nome: 'Concluído', ordem: 3, ativo: true } },
    { nome: 'checklists', doc: { id: 'cl1', nome: 'Checklist Herança', tipoProcesso: 'herancas', itens: [], ativo: true } },
    { nome: 'tabelas_de_prazos', doc: { id: 'tpp1', tipoProcesso: 'herancas', entidade: 'conservatorias_irn', tipoPrazo: 'legal', dias: 30, descricao: 'Prazo exemplo', ativo: true } },
    { nome: 'modelos_de_documentos', doc: { id: 'md1', nome: 'Modelo Base', tipoProcesso: 'herancas', conteudoTemplate: '', versao: 1, ativo: true } },
    { nome: 'utilizadores', doc: { id: 'u1', nome: 'Administrador', email: 'admin@sistema.pt', funcao: 'gestor', ativo: true } },
    { nome: 'faturas', doc: { id: '__seed__', numero: 'SEED', clienteId: '', estado: 'cancelada', valorTotal: 0, dataEmissao: ts, createdAt: ts } },
    { nome: 'pagamentos', doc: { id: '__seed__', faturaId: '__seed__', valor: 0, dataPagamento: ts, createdAt: ts } },
    { nome: 'despesas', doc: { id: '__seed__', processoTipo: 'herancas', processoId: '__seed__', descricao: 'Seed', valor: 0, data: ts, createdAt: ts } },
    { nome: 'comunicacoes', doc: { id: '__seed__', tipo: 'mensagem_interna', assunto: 'Seed', mensagem: '', data: ts, createdAt: ts } },
    { nome: 'logs_financeiros', doc: { id: '__seed__', tipo: 'seed', referenciaTipo: 'faturas', referenciaId: '__seed__', data: ts } },
    { nome: 'logs_integracoes', doc: { id: '__seed__', integracaoId: '__seed__', acao: 'seed', data: ts } },
    { nome: 'logs_comunicacoes', doc: { id: '__seed__', comunicacaoId: '__seed__', acao: 'seed', data: ts } },
    { nome: 'anexos_comunicacao', doc: { id: '__seed__', comunicacaoId: '__seed__', url: '', nomeFicheiro: 'seed', dataUpload: ts } },
  ];
  let ok = 0, err = 0;
  for (const c of colecoes) {
    try {
      await firestoreDb.collection(c.nome).doc(String(c.doc.id)).set({ ...c.doc, __seed: true }, { merge: true });
      ok++; console.log('OK:', c.nome);
    } catch (e) {
      err++; console.warn('Erro', c.nome, e.message);
    }
  }
  console.log('Concluído:', ok, 'ok,', err, 'erros. Atualize a consola do Firebase para ver as coleções.');
})();
