import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFoQ6FcsUWiPYenUD81ATp2Lpj_uYsgKU",
  authDomain: "satvik-spot-staging.firebaseapp.com",
  projectId: "satvik-spot-staging",
  storageBucket: "satvik-spot-staging.firebasestorage.app",
  messagingSenderId: "1006538799897",
  appId: "1:1006538799897:web:22635763b8678b1aa3e388",
  measurementId: "G-3N40GBKVM2"
};

const app = window._firebaseApp = initializeApp(firebaseConfig);
window.db = getFirestore(app);
window.auth = getAuth(app);
try { window.analytics = getAnalytics(app); } catch (e) {}

window.API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8080'
  : 'https://satvik-spot-backend-staging.onrender.com';

setPersistence(window.auth, browserLocalPersistence).catch(e => console.warn("Auth persistence:", e));
window.firebaseLoaded = true;
