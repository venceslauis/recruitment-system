const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs');
const path = require('path');

// Extract properties from PREDICTION_ENDPOINT
const endpoint = process.env.PREDICTION_ENDPOINT || "";
const match = endpoint.match(/projects\/(\d+)\/locations\/([^\/]+)\/processors\/([a-zA-Z0-9]+)/);

const projectId = process.env.PROJECT_ID || (match ? match[1] : "");
const location = process.env.LOCATION || (match ? match[2] : "us");
const processorId = process.env.PROCESSOR_ID || (match ? match[3] : "");

// Initialize client
let client = null;
try {
  // Use Application Default Credentials directly (set via gcloud login)
  client = new DocumentProcessorServiceClient();
} catch (err) {
  console.warn("WARNING: Document AI client failed to initialize.");
}

// Main Document AI Function
async function processDocument(filePath) {
  if (!client) {
    return { success: false, error: "Google Cloud credentials missing or invalid. Check GOOGLE_APPLICATION_CREDENTIALS.", text: "" };
  }

  try {
    const file = fs.readFileSync(filePath);
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    console.log("🚀 Sending document to Document AI...");
    console.log("Processor Path:", name);

    const request = {
      name,
      rawDocument: {
        content: file.toString('base64'),
        mimeType: getMimeType(filePath),
      },
    };

    const [result] = await client.processDocument(request);
    const document = result.document;
    const text = document.text;

    console.log("✅ OCR Success");
    console.log(`📝 Extracted length: ${text.length}`);

    const pages = document.pages ? document.pages.map((page) => ({
      pageNumber: page.pageNumber,
      text: extractPageText(document, page),
    })) : [];

    return { success: true, text, pages };

  } catch (error) {
    console.error('OCR Error:', error);
    return { success: false, error: error.message, text: "" };
  }
}

// Helper: Extract text per page
function extractPageText(document, page) {
  let pageText = '';
  if (!page.blocks) return '';

  page.blocks.forEach((block) => {
    block.layout.textAnchor.textSegments.forEach((segment) => {
      const start = segment.startIndex || 0;
      const end = segment.endIndex;
      pageText += document.text.substring(start, end);
    });
  });

  return pageText;
}

// Helper: Detect MIME type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      // Fallback for docx or other formats if needed, or default generic
      return 'application/pdf'; 
  }
}

// --- Adapters for existing architecture ---

// Adapter function to maintain compatibility with your existing candidateRoutes
async function extractText(filePath) {
  const result = await processDocument(filePath);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.text;
}

// Keep existing heuristic extractors
function extractResumeFeatures(text) {
  // 1. Regex extractions for standard entities
  const emailRegex = /[a-zA-Z0-9._%+-]+(?:\[at\]|@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/;
  const cgpaRegex = /(?:cgpa|gpa|cpi)[\s\:\-]*([0-9]{1,2}(?:\.[0-9]{1,2})?)/i;
  const expRegex = /([0-9]+(?:\.[0-9]+)?)\+?\s*years?(?:\s*of)?\s*experience/i;
  const degreeRegex = /(b\.?tech|b\.?e\.?|b\.?sc|m\.?tech|m\.?sc|bca|mca|bba|mba|ph\.?d|bachelor(?:'s)?|master(?:'s)?)/i;

  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);
  const cgpaMatch = text.match(cgpaRegex);
  const expMatch = text.match(expRegex);
  const degreeMatch = text.match(degreeRegex);

  // Split lines for section parsing
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Heuristic: Name is typically one of the first 3 lines and doesn't contain heavy punctuation
  let name = "";
  for (let i = 0; i < Math.min(3, lines.length); i++) {
     if (lines[i].split(' ').length <= 4 && !lines[i].includes('@') && !/\d/.test(lines[i])) {
        name = lines[i];
        break;
     }
  }

  const sections = {
    skills: ["skills", "technical skills", "core competencies", "technologies"],
    projects: ["projects", "personal projects", "academic projects"],
    internships: ["internships", "experience", "work experience", "employment"],
    education: ["education", "academic background"],
    summary: ["summary", "profile", "about", "objective", "professional summary"],
    tools: ["tools", "frameworks", "software"]
  };

  const getSectionContent = (keywordsArray) => {
    let inSection = false;
    let sectionLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        
        // Check if we enter the target section
        const startsSection = keywordsArray.some(kw => line === kw || line.startsWith(kw + ":"));
        if (startsSection) {
            inSection = true;
            continue;
        }
        
        if (inSection) {
            // Check if we hit a new section
            const isAnyOtherSection = Object.values(sections).flat().some(kw => line === kw || line.startsWith(kw + ":"));
            if (isAnyOtherSection) break;
            
            sectionLines.push(lines[i]);
        }
    }
    return sectionLines;
  };

  const skillsBlock = getSectionContent(sections.skills);
  const projectsBlock = getSectionContent(sections.projects);
  const internshipsBlock = getSectionContent(sections.internships);

  // Cleaner utility for bullet points, odd spacings, and standalone weird commas
  const sanitize = (text) => {
      if (!text) return "";
      return text
        .replace(/[•●▪\-*\u2022\u25CF\u25AA]/g, ' ') // Remove various bullet points
        .replace(/\s+/g, ' ')  // Collapse multiple spaces
        .replace(/ ,/g, ',')   // Fix spaces before commas
        .replace(/^[, ]+/, '') // Remove leading commas/spaces
        .replace(/[, ]+$/, '') // Remove trailing commas/spaces
        .replace(/,+/g, ',')   // Remove duplicate commas
        .trim();
  };

  return {
    name: name.replace(/[^a-zA-Z\s]/g, "").trim(),
    email: emailMatch ? emailMatch[0].replace("[at]", "@") : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    cgpa: cgpaMatch ? parseFloat(cgpaMatch[1]) : "",
    experience: expMatch ? parseFloat(expMatch[1]) : "",
    degree: degreeMatch ? degreeMatch[0] : "",
    skills: sanitize(skillsBlock.join(", ")).slice(0, 1000), // Prevent infinite blocks
    projects: sanitize(projectsBlock.join("\n")).slice(0, 1000),
    internships: sanitize(internshipsBlock.join("\n")).slice(0, 1000)
  };
}

function extractCertificateFeatures(text) {
   const lowerText = text.toLowerCase();
   const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
   
   let name = "";
   const nameTriggers = ["awarded to", "presented to", "certifies that", "this certificate is given to", "successfully completed"];
   
   for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      if (nameTriggers.some(t => lineLower.includes(t))) {
         if (i + 1 < lines.length) {
            name = lines[i+1];
         }
         break;
      }
   }
   
   const title = lines.length > 0 ? lines[0] + (lines.length > 1 ? " " + lines[1] : "") : "";

   return { name, title };
}

module.exports = { 
  extractText, 
  extractResumeFeatures, 
  extractCertificateFeatures,
  processDocument 
};