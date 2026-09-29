// CommonJS entry wrapper for Electron
const path = require('path');
const fs = require('fs');

// Dynamically import the ES module electron.js
import('../electron.js').catch((err) => {
  console.error('Failed to load electron.js:', err);
});
