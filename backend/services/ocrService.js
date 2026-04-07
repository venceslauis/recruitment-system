const Tesseract = require("tesseract.js");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else {
    // Treat as image
    const result = await Tesseract.recognize(filePath, "eng");
    return result.data.text;
  }
}

function extractResumeFeatures(text) {
  // Simple regex heuristics
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/;
  
  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);

  // We look for basic keywords
  const lowerText = text.toLowerCase();
  
  // A naive way to extract sections: look for keywords and take following lines
  // In a real system, you'd use NLP models like spaCy or fine-tuned LLMs
  const sections = {
    skills: "skills",
    projects: "projects",
    internships: "internships",
    experience: "experience",
    education: "education"
  };

  const getSectionLines = (keyword) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let inSection = false;
    let sectionLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes(keyword) && line.length < keyword.length + 15) {
            inSection = true;
            continue;
        }
        
        if (inSection) {
            // Check if it looks like a new section header
            const isProbablyHeader = Object.values(sections).some(s => line.includes(s) && line.length < s.length + 15);
            if (isProbablyHeader) break;
            sectionLines.push(lines[i]);
        }
    }
    return sectionLines;
  };

  return {
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0].replace(/\D/g, "") : "",
    skills: getSectionLines("skills").join(", "),
    projects: getSectionLines("projects").join("\n"),
    internships: getSectionLines("internships").join("\n")
  };
}

function extractCertificateFeatures(text) {
   // Certificate parsing is hard. Realistically, we find "Name" or large text blocks.
   // Providing a heuristic best-effort.
   // We might look for "certifies that", "presented to", "awarded to" and get the next line.
   const lowerText = text.toLowerCase();
   const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
   
   let name = "";
   const nameTriggers = ["awarded to", "presented to", "certifies that", "this certificate is given to"];
   
   for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      if (nameTriggers.some(t => lineLower.includes(t))) {
         if (i + 1 < lines.length) {
            name = lines[i+1];
         }
         break;
      }
   }
   
   // Title heuristic: maybe the first or second line with largest font (we just take top lines)
   const title = lines.length > 0 ? lines[0] + (lines.length > 1 ? " " + lines[1] : "") : "";

   return { name, title };
}

module.exports = { extractText, extractResumeFeatures, extractCertificateFeatures };