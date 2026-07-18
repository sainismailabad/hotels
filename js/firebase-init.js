// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyBpWuZTfG6S0ncfOz8VPCBhf_e7iGsuK3I",
  authDomain: "hotels-91bf8.firebaseapp.com",
  databaseURL: "https://hotels-91bf8-default-rtdb.firebaseio.com",
  projectId: "hotels-91bf8",
  storageBucket: "hotels-91bf8.firebasestorage.app",
  messagingSenderId: "1043763310653",
  appId: "1:1043763310653:web:97db059687f71778d83a54",
  measurementId: "G-M6LG67TJV6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();