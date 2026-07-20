import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFoQ6FcsUWiPYenUD81ATp2Lpj_uYsgKU",
  authDomain: "satvik-spot-staging.firebaseapp.com",
  projectId: "satvik-spot-staging",
  storageBucket: "satvik-spot-staging.firebasestorage.app",
  messagingSenderId: "1006538799897",
  appId: "1:1006538799897:web:22635763b8678b1aa3e388"
};

const app = window._firebaseApp = initializeApp(firebaseConfig);
window.db = getFirestore(app);
window.auth = getAuth(app);

window.API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8080'
  : 'https://satvik-spot-backend-staging.onrender.com';

// Use session persistence for private admin portal
setPersistence(window.auth, browserSessionPersistence).catch(e => console.warn("Admin Auth persistence:", e));
window.firebaseLoaded = true;
