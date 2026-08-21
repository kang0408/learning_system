import fs from 'fs';
import path from 'path';
import { parseDocumentBuffer } from '../documentParser';

describe('DocumentParser Utility', () => {
  it('should parse plain text buffer correctly', async () => {
    const text = 'Hello world, this is a test document.';
    const buffer = Buffer.from(text, 'utf-8');
    const result = await parseDocumentBuffer(buffer, 'text/plain', 'test.txt');

    expect(result.text).toBe(text);
    expect(result.pageCount).toBe(1);
  });

  it('should handle markdown buffer correctly', async () => {
    const md = '# Unit 1\n\nContent of unit 1';
    const buffer = Buffer.from(md, 'utf-8');
    const result = await parseDocumentBuffer(buffer, 'text/markdown', 'unit1.md');

    expect(result.text).toContain('# Unit 1');
    expect(result.pageCount).toBe(1);
  });

  it('should parse real PDF file buffer correctly', async () => {
    const samplePdfPath = path.resolve(__dirname, '../../../../node_modules/pdf-parse/test/data/01-valid.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buffer = fs.readFileSync(samplePdfPath);
      const result = await parseDocumentBuffer(buffer, 'application/pdf', '01-valid.pdf');

      expect(result).toBeDefined();
      expect(result.text.length).toBeGreaterThan(100);
      expect(result.pageCount).toBe(14);
    }
  });
});
