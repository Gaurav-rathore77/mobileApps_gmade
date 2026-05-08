const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['resume', 'notes', 'research_paper', 'contract', 'invoice', 'study_material', 'other'],
    default: 'other'
  },
  summary: {
    type: String
  },
  keyPoints: [{
    type: String
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PDF', pdfSchema);
