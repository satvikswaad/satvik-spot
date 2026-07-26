import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFoQ6FcsUWiPYenUD81ATp2Lpj_uYsgKU",
  authDomain: "satvik-spot-staging.firebaseapp.com",
  projectId: "satvik-spot-staging",
  storageBucket: "satvik-spot-staging.firebasestorage.app",
  messagingSenderId: "1006538799897",
  appId: "1:1006538799897:web:22635763b8678b1aa3e388",
  measurementId: "G-3N40GBKVM2"
};

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isLocalhost) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const app = window._firebaseApp = initializeApp(firebaseConfig);
window.db = getFirestore(app);
window.auth = getAuth(app);
window.GoogleAuthProvider = GoogleAuthProvider;
window.signInWithPopup = signInWithPopup;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;

window.firestoreDoc = doc;
window.firestoreGetDoc = getDoc;
window.firestoreSetDoc = setDoc;
window.firestoreServerTimestamp = serverTimestamp;
try { window.analytics = getAnalytics(app); } catch (e) {}

const RECAPTCHA_SITE_KEY = '6Ld2X2ItAAAAAE0c7CP47UyRzRAojxIfBEYEhCAY';

try {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
  window.appCheck = appCheck;
  window.getAppCheckToken = async function() {
    try {
      const res = await getToken(appCheck, false);
      return res ? res.token : '';
    } catch (e) {
      console.warn('Failed to retrieve App Check token:', e);
      return '';
    }
  };
} catch (e) {
  console.warn('App Check initialization warning:', e);
}

window.API_BASE_URL = isLocalhost
  ? 'http://localhost:5000'
  : 'https://satvik-spot-backend-staging.onrender.com';

setPersistence(window.auth, browserLocalPersistence).catch(e => console.warn("Auth persistence:", e));
window.firebaseLoaded = true;
