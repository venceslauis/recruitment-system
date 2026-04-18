const axios = require('axios');
(async () => {
  try {
    // We will just invoke it to see the stack trace in the backend or node terminal
    console.log("Testing POST /api/candidate/apply locally to trap the 500 error...");
  } catch (e) {
    console.error(e);
  }
})();
