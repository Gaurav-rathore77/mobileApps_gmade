const PDF = require('../models/pdf');
const {
  extractTextFromPDF,
  detectDocumentType,
  generateSummary,
  extractKeyPoints,
  answerQuestion
} = require('../services/pdfService');
const fs = require('fs');
const path = require('path');

/**
 * Upload and process PDF
 */
async function uploadPDF(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(filePath);

    // Detect document type
    const documentType = await detectDocumentType(extractedText);

    // Generate summary
    const summary = await generateSummary(extractedText, documentType);

    // Extract key points
    const keyPoints = await extractKeyPoints(extractedText, documentType);

    // Save to database
    const pdf = new PDF({
      userId,
      fileName,
      filePath,
      extractedText,
      documentType,
      summary,
      keyPoints
    });

    await pdf.save();

    res.json({
      message: 'PDF uploaded and processed successfully',
      pdf: {
        id: pdf._id,
        fileName: pdf.fileName,
        documentType: pdf.documentType,
        summary: pdf.summary,
        keyPoints: pdf.keyPoints,
        uploadedAt: pdf.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to upload and process PDF' });
  }
}

/**
 * Get all PDFs for a user
 */
async function getUserPDFs(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pdfs = await PDF.find({ userId })
      .select('fileName documentType summary keyPoints uploadedAt')
      .sort({ uploadedAt: -1 });

    res.json({ pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
}

/**
 * Get single PDF details
 */
async function getPDF(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pdf = await PDF.findOne({ _id: id, userId });

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.json({
      pdf: {
        id: pdf._id,
        fileName: pdf.fileName,
        documentType: pdf.documentType,
        summary: pdf.summary,
        keyPoints: pdf.keyPoints,
        uploadedAt: pdf.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
}

/**
 * Ask question about PDF
 */
async function askQuestion(req, res) {
  try {
    const { pdfId, question } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!pdfId || !question) {
      return res.status(400).json({ error: 'PDF ID and question are required' });
    }

    // Get PDF from database
    const pdf = await PDF.findOne({ _id: pdfId, userId });

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Answer question using AI
    const answer = await answerQuestion(pdf.extractedText, question, pdf.documentType);

    res.json({
      question,
      answer
    });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
}

/**
 * Delete PDF
 */
async function deletePDF(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pdf = await PDF.findOne({ _id: id, userId });

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(pdf.filePath)) {
      fs.unlinkSync(pdf.filePath);
    }

    // Delete from database
    await PDF.deleteOne({ _id: id });

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
}

module.exports = {
  uploadPDF,
  getUserPDFs,
  getPDF,
  askQuestion,
  deletePDF
};
