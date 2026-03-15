const axios = require("axios");

async function getScore(data){

const res = await axios.post(
"http://localhost:8000/predict",
data
);

return res.data.score;

}

module.exports = {getScore};