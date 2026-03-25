// src/utils/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../config/service-account.json');

// Prevent double initialization errors
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;