// ---------------------------------------------------------
// PURGAR DOCUMENTOS ELIMINADOS (deleted: true) DO FIRESTORE
// ---------------------------------------------------------
// Remove de forma DEFINITIVA apenas os itens marcados como eliminados.
// Os dados ativos (deleted: false ou sem campo) ficam intactos.
//
// Alternativa: Na secção Backup da aplicação, use o botão
// "Remover itens eliminados da base de dados" (não precisa deste script).
//
// Executar: node purgarDocumentosEliminados.js
// Requer: npm install firebase
// ---------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBv1KtXvzvHKZRL367ST4GrZFTYVOmFuzE",
  authDomain: "anapaulamedinasolicitadora.firebaseapp.com",
  projectId: "anapaulamedinasolicitadora",
  storageBucket: "anapaulamedinasolicitadora.firebasestorage.app",
  messagingSenderId: "420983654368",
  appId: "1:420983654368:web:4918cacde4ea3603b78d85",
  measurementId: "G-Z3DM5PB0LR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const colecoes = [
  "clientes",
  "honorarios",
  "contratos",
  "prazos",
  "notificacoes",
  "herancas",
  "migracoes",
  "registos",
  "documentos",
  "tarefas",
  "convidados"
];

const BATCH_SIZE = 500;

/** Remove permanentemente documentos com deleted === true de uma coleção */
async function purgarEliminados(nome) {
  const ref = collection(db, nome);
  let totalApagados = 0;

  while (true) {
    const snapshot = await getDocs(ref);
    const aApagar = snapshot.docs.filter((d) => {
      const data = d.data();
      return data.deleted === true;
    });

    if (aApagar.length === 0) break;

    const batch = writeBatch(db);
    const limite = Math.min(aApagar.length, BATCH_SIZE);
    for (let i = 0; i < limite; i++) {
      const docSnap = aApagar[i];
      batch.delete(doc(db, nome, docSnap.id));
    }
    await batch.commit();
    totalApagados += limite;
  }

  if (totalApagados > 0) {
    console.log(`✔️ ${nome}: ${totalApagados} documento(s) eliminado(s) removido(s)`);
  }
  return totalApagados;
}

async function main() {
  console.log("🧹 PURGAR DOCUMENTOS ELIMINADOS (deleted: true)\n");
  console.log("Vai remover da base de dados apenas os itens que já foram \"apagados\" no sistema.\n");

  let total = 0;
  for (const nome of colecoes) {
    try {
      total += await purgarEliminados(nome);
    } catch (err) {
      console.warn(`⚠️ Erro em ${nome}:`, err.message);
    }
  }

  if (total === 0) {
    console.log("\n✅ Nenhum documento eliminado encontrado. Base de dados já está limpa.");
  } else {
    console.log(`\n✅ Total: ${total} documento(s) eliminado(s) removido(s) da base de dados.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
