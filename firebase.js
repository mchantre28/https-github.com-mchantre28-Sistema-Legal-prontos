import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração igual à do script.js (consola Firebase)
export const firebaseConfig = {
    apiKey: "AIzaSyBv1KtXvzvHKZRL367ST4GrZFTYVOmFuzE",
    authDomain: "anapaulamedinasolicitadora.firebaseapp.com",
    projectId: "anapaulamedinasolicitadora",
    storageBucket: "anapaulamedinasolicitadora.firebasestorage.app",
    messagingSenderId: "420983654368",
    appId: "1:420983654368:web:4918cacde4ea3603b78d85"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
