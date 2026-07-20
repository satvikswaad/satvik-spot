// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAjuli4VMIGwDgy3sR00KW8b1nO6AXCEtE",
    authDomain: "satwiksweetsandpickels.firebaseapp.com",
    projectId: "satwiksweetsandpickels",
    storageBucket: "satwiksweetsandpickels.firebasestorage.app",
    messagingSenderId: "635345243364",
    appId: "1:635345243364:web:e00006248b0a1cc2ba70f1",
    measurementId: "G-ZHD8X4H8F4"
};

// Initialize Firebase
const app = window._firebaseApp = initializeApp(firebaseConfig);
window.db = getFirestore(app);
window.auth = getAuth(app);
window.storage = getStorage(app);
window.analytics = getAnalytics(app);

// Set auth persistence to local (survives browser close)
setPersistence(window.auth, browserLocalPersistence).catch(e => console.warn("Auth persistence:", e));

window.firebaseLoaded = true;
console.log("🔥 Firebase Ready");
