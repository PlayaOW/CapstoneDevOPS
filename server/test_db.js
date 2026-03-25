try {
  require('dotenv').config();
  console.log("Loading db...");
  const db = require('./db');
  console.log("DB Loaded:", db);
} catch (e) {
  console.error("CRASH:", e);
}
