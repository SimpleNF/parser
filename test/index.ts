import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { SNFFileParser } from '../src/file';
import { cleanBlank } from '../src/util';
import { walkBlocks } from '../src/walk';

const testPath = path.resolve(import.meta.dirname, './case/*.snf');
const files = await glob(testPath);
const fileParser = new SNFFileParser();

for (const file of files) {
  try {
    const content = await fs.readFileSync(file, 'utf-8');
    const result = await fileParser.parse(content);
    fs.writeFileSync(file.replace('.snf', '.json'), JSON.stringify(result, null, 2));
    const cleanResult = walkBlocks(result, cleanBlank);
    fs.writeFileSync(file.replace('.snf', '.clean.json'), JSON.stringify(cleanResult, null, 2));
  } catch (error) {
    console.error('File:', file);
    console.error((error as Error).message);
  }
}
