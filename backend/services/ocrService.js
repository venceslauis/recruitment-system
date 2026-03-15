const Tesseract = require("tesseract.js");

async function extractText(file){

const result = await Tesseract.recognize(file,"eng");

return result.data.text;

}

module.exports = {extractText};