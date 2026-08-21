import mammoth from 'mammoth';

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  info?: any;
}

async function extractPdfText(buffer: Buffer): Promise<ParsedDocument> {
  const pdfModule = require('pdf-parse');

  // Handle pdf-parse v2+ (Class { PDFParse })
  if (pdfModule?.PDFParse || (typeof pdfModule === 'function' && pdfModule.prototype?.getText)) {
    const PDFClass = pdfModule.PDFParse || pdfModule;
    const parser = new PDFClass({ data: buffer });
    try {
      const res = await parser.getText();
      let info = {};
      if (typeof parser.getInfo === 'function') {
        info = await parser.getInfo().catch(() => ({}));
      }
      return {
        text: res.text || '',
        pageCount: res.total || res.pages?.length || 1,
        info,
      };
    } finally {
      if (typeof parser.destroy === 'function') {
        await parser.destroy().catch(() => {});
      }
    }
  }

  // Handle pdf-parse v1 (Function: pdfParse(buffer))
  if (typeof pdfModule === 'function') {
    const data = await pdfModule(buffer);
    return {
      text: data.text || '',
      pageCount: data.numpages || 1,
      info: data.info || {},
    };
  }

  if (typeof pdfModule?.default === 'function') {
    const data = await pdfModule.default(buffer);
    return {
      text: data.text || '',
      pageCount: data.numpages || 1,
      info: data.info || {},
    };
  }

  throw new Error('Unsupported pdf-parse module format');
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<ParsedDocument> {
  const isPdf = mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf');
  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    filename?.toLowerCase().endsWith('.docx');

  if (isPdf) {
    return await extractPdfText(buffer);
  }

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value || '',
      pageCount: 1,
      info: result.messages || [],
    };
  }

  // Fallback for plain text or markdown
  return {
    text: buffer.toString('utf-8'),
    pageCount: 1,
  };
}
