import { glob } from 'glob'
import { SBNFParser } from '../src';
import path from 'path';
import fs from 'fs';

const testPath = path.resolve(import.meta.dirname, './case/*.snf')
const files = await glob(testPath)
const parser = new SBNFParser();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8')
  try {
    const result = parser.parse(content);
    fs.writeFileSync(file.replace('.snf', '.json'), JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('File:', file);
    console.error((error as Error).message);
  }
}
