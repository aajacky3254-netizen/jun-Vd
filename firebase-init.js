// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAnhhaiWXn5KFtU1YdB0oR_S9E0qhAlJuI",
    authDomain: "jun-bus-dispatch.firebaseapp.com",
    projectId: "jun-bus-dispatch",
    storageBucket: "jun-bus-dispatch.firebasestorage.app",
    messagingSenderId: "621725744717",
    appId: "1:621725744717:web:64e663648d8c76b9bd6604"
};

// 初始化並導出，讓其他檔案可以直接引用
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);