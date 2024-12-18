import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { SBNFFileParser } from '../src/file';
import { cleanBlank, addEnumName, addRepeatName } from '../src/util';

const testPath = path.resolve(import.meta.dirname, './case/*.snf');
const files = await glob(testPath);
const fileParser = new SBNFFileParser();

for (const file of files) {
  try {
    const result = await fileParser.parse(file);
    fs.writeFileSync(file.replace('.snf', '.json'), JSON.stringify(result, null, 2));
    const cleanResult = await fileParser.parse(file, cleanBlank, addEnumName, addRepeatName);
    fs.writeFileSync(file.replace('.snf', '.clean.json'), JSON.stringify(cleanResult, null, 2));
  } catch (error) {
    console.error('File:', file);
    console.error((error as Error).message);
  }
}
