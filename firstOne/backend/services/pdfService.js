const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
// const fs = require("fs");
// const pdf = require("pdf-parse");
// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Extract text from PDF file
 */
// async function extractTextFromPDF(filePath) {
//   try {
//     console.log('📄 Reading PDF file:', filePath);

//     const dataBuffer = fs.readFileSync(filePath);

//     console.log('📦 PDF Buffer Loaded');

//     const data = await pdf(dataBuffer);

//     console.log('✅ PDF Text Extracted');

//     return data.text;
//   } catch (error) {
//     console.error('❌ Error extracting text from PDF:', error);
    
//     // Check if PDF is password protected
//     if (error.message && error.message.includes('No password given')) {
//       throw new Error('This PDF is password protected. Please upload an unprotected PDF.');
//     }
    
//     throw new Error('Failed to extract text from PDF');
//   }
// }


const extractTextFromPDF = async (filePath) => {
  try {
    console.log("📄 Reading PDF file:", filePath);

    const dataBuffer = fs.readFileSync(filePath);

    console.log("📦 PDF Buffer Loaded");

    const data = await pdf(dataBuffer);

    console.log("✅ PDF Text Extracted");

    return data.text;
  } catch (error) {
    console.error("❌ Error extracting text from PDF:", error);

    // PASSWORD PROTECTED PDF
    if (
      error.message?.includes("No password given") ||
      error.code === 1
    ) {
      throw new Error(
        "This PDF is password protected. Please upload an unprotected PDF."
      );
    }

    // INVALID PDF
    if (
      error.message?.includes("Invalid PDF") ||
      error.message?.includes("FormatError")
    ) {
      throw new Error("Invalid or corrupted PDF file.");
    }

    // GENERAL ERROR
    throw new Error("Failed to extract text from PDF.");
  }
};

module.exports = {
  extractTextFromPDF,
  detectDocumentType,
  generateSummary,
  extractKeyPoints,
  answerQuestion,
};

/**
 * Detect document type using AI
 */
async function detectDocumentType(text) {
  if (!genAI) {
    console.log('⚠️ Gemini API key not set');
    return 'other';
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const prompt = `
Analyze this document text and determine the document type.

Respond with ONLY one of these words:
resume
notes
research_paper
contract
invoice
study_material
other

Document Text:
${text.substring(0, 3000)}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const type = response.text().trim().toLowerCase();

    console.log('📑 Detected Document Type:', type);

    const validTypes = [
      'resume',
      'notes',
      'research_paper',
      'contract',
      'invoice',
      'study_material',
      'other',
    ];

    return validTypes.includes(type) ? type : 'other';
  } catch (error) {
    console.error('❌ Error detecting document type:', error);
    return 'other';
  }
}

/**
 * Generate summary using AI
 */
async function generateSummary(text, documentType) {
  if (!genAI) {
    return 'Gemini AI not configured.';
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    let prompt = '';

    switch (documentType) {
      case 'resume':
        prompt = `
Analyze this resume and provide:
- Skills
- Experience
- Education
- Projects
- Overall summary

Resume Text:
${text.substring(0, 10000)}
`;
        break;

      case 'notes':
        prompt = `
Summarize these study notes in simple English.

Extract:
- Key concepts
- Important points
- Revision notes

Notes:
${text.substring(0, 10000)}
`;
        break;

      case 'research_paper':
        prompt = `
Explain this research paper in simple English.

Include:
- Topic
- Methodology
- Results
- Conclusion

Paper:
${text.substring(0, 10000)}
`;
        break;

      case 'contract':
        prompt = `
Summarize this contract.

Highlight:
- Clauses
- Risks
- Obligations
- Important terms
- Deadlines

Contract:
${text.substring(0, 10000)}
`;
        break;

      case 'invoice':
        prompt = `
Extract invoice information:
- Date
- Amount
- Items
- Payment terms

Invoice:
${text.substring(0, 10000)}
`;
        break;

      default:
        prompt = `
Summarize this document in simple English.

Document:
${text.substring(0, 10000)}
`;
    }

    const result = await model.generateContent(prompt);

    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    
    // RETRY for 503 errors
    if (error.status === 503) {
      console.log('🔄 Retrying with fallback...');
      return `Document type: ${documentType}. Content length: ${text.length} characters. AI processing temporarily unavailable - please try again later.`;
    }
    
    throw new Error('Failed to generate summary');
  }
}

/**
 * Extract key points using AI
 */
async function extractKeyPoints(text, documentType) {
  if (!genAI) {
    return ['Gemini AI not configured'];
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const prompt = `
Extract most important key points from this ${documentType}.

Return concise bullet points.

Document:
${text.substring(0, 10000)}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const pointsText = response.text();

    const points = pointsText
      .split('\n')
      .filter(
        (line) =>
          line.trim() &&
          (line.startsWith('-') ||
            line.startsWith('•') ||
            line.startsWith('*'))
      )
      .map((line) => line.replace(/^[-•*]\s*/, '').trim());

    return points.length > 0 ? points : [pointsText];
  } catch (error) {
    console.error('❌ Error extracting key points:', error);
    
    // RETRY for 503 errors
    if (error.status === 503) {
      console.log('🔄 Retrying with fallback...');
      return [
        `Document type: ${documentType}`,
        `Content length: ${text.length} characters`,
        'Key features detected in document',
        'AI processing temporarily unavailable - please try again later'
      ];
    }
    
    throw new Error('Failed to extract key points');
  }
}

/**
 * Ask question from PDF
 */
async function answerQuestion(text, question, documentType) {
  if (!genAI) {
    return 'Gemini AI not configured.';
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const prompt = `
You are an advanced AI PDF assistant.

Answer ONLY using the document content below.

Document Type:
${documentType}

Question:
${question}

Document Content:
${text.substring(0, 15000)}

Rules:
- Answer clearly
- Use simple English
- Do not hallucinate
- If information is missing, say it clearly
- Use bullet points if needed
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('❌ Error answering question:', error);
    throw new Error('Failed to answer question');
  }
}

module.exports = {
  extractTextFromPDF,
  detectDocumentType,
  generateSummary,
  extractKeyPoints,
  answerQuestion,
};