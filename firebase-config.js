// Firebase Configuration (Compat Version for file:// usage)
// This uses the 'firebase' global object from the CDN scripts in HTML.

const firebaseConfig = {
    apiKey: "AIzaSyDD9moYVWRPdd3pwgXqVDDE09Lr6N9-6dA",
    authDomain: "truptiagarbatti-a9902.firebaseapp.com",
    projectId: "truptiagarbatti-a9902",
    storageBucket: "truptiagarbatti-a9902.firebasestorage.app",
    messagingSenderId: "799076437970",
    appId: "1:799076437970:web:0ead01a252a78b5031420b",
    measurementId: "G-91R8TT1F3R"
};

// Initialize Firebase
let db;
let storage;

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase Initialized");
} else {
    console.error("Firebase SDK not loaded.");
}
