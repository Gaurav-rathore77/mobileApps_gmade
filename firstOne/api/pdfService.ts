// Centralized IP Configuration - Change IP in app/config/ip.ts only
import { IP_ADDRESS } from '../app/config/ip';

// Auto-generate URLs from centralized IP
const API_URLS = [
  `http://${IP_ADDRESS}:3000`,
];

export interface PDF {
  id: string;
  fileName: string;
  documentType: string;
  summary: string;
  keyPoints: string[];
  uploadedAt: string;
}

export interface PDFUploadResponse {
  message: string;
  pdf: PDF;
}

export interface PDFListResponse {
  pdfs: PDF[];
}

export interface ChatResponse {
  question: string;
  answer: string;
}

/**
 * Upload PDF file
 */
export const uploadPDF = async (fileUri: string, fileName: string, mimeType: string, token: string): Promise<PDFUploadResponse> => {
  let lastError: Error | null = null;
  
  for (const baseUrl of API_URLS) {
    try {
      const formData = new FormData();
      formData.append('pdf', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      const response = await fetch(`${baseUrl}/pdf/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error uploading PDF to ${baseUrl}:`, error);
    }
  }

  throw lastError || new Error('Failed to upload PDF');
};

/**
 * Get all PDFs for current user
 */
export const getUserPDFs = async (token: string): Promise<PDFListResponse> => {
  let lastError: Error | null = null;
  
  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}/pdf/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch PDFs error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error fetching PDFs from ${baseUrl}:`, error);
    }
  }

  throw lastError || new Error('Failed to fetch PDFs');
};

/**
 * Get single PDF details
 */
export const getPDF = async (id: string, token: string): Promise<{ pdf: PDF }> => {
  let lastError: Error | null = null;
  
  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}/pdf/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error fetching PDF from ${baseUrl}:`, error);
    }
  }

  throw lastError || new Error('Failed to fetch PDF');
};

/**
 * Ask question about PDF
 */
export const askQuestion = async (pdfId: string, question: string, token: string): Promise<ChatResponse> => {
  let lastError: Error | null = null;
  
  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}/pdf/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pdfId, question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error asking question to ${baseUrl}:`, error);
    }
  }

  throw lastError || new Error('Failed to ask question');
};

/**
 * Delete PDF
 */
export const deletePDF = async (id: string, token: string): Promise<{ message: string }> => {
  let lastError: Error | null = null;
  
  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}/pdf/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error deleting PDF from ${baseUrl}:`, error);
    }
  }

  throw lastError || new Error('Failed to delete PDF');
};
