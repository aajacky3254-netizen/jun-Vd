// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOEygVwCJbRLG68mJcN6MHu6YvgWkAPOc",
  authDomain: "jun-bus-vd.firebaseapp.com",
  projectId: "jun-bus-vd",
  storageBucket: "jun-bus-vd.firebasestorage.app",
  messagingSenderId: "984462733556",
  appId: "1:984462733556:web:c8bf64415ea171eca6aea1",
  measurementId: "G-6RYLKZHBZ3"
};

// 初始化並導出，讓其他檔案可以直接引用
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);