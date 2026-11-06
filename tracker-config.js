// Optional account sync for the study tracker.
// Studying works without this. Leave `firebase: null` to run without accounts.
// To enable email + password sync, paste your Firebase web app config here, e.g.
// firebase: { apiKey: "...", authDomain: "....firebaseapp.com", projectId: "...", appId: "..." }
// (These values are designed to be public; access is protected by Firestore security rules.)
window.TRACKER_CONFIG = {
  firebase: null
};
