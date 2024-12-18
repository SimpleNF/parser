import fs from 'fs';
import { SBNFParser } from './block';
import { Block, Node } from './type';

export class SBNFFileParser {
  private codeParser = new SBNFParser();

  async parse(path: string, ...walks: ((node: Node) => Node)[]) {
    const content = await fs.promises.readFile(path, 'utf-8');
    const lines = content.split('\n');

    const blocks: Partial<Block>[] = [];
    let result = { comment: '', content: '' };

    for (const line of lines) {
      if (!line.trim()) {
        if (result.comment || result.content) {
          blocks.push(result);
        }
        result = { comment: '', content: '' };
        continue;
      }
      if (line.startsWith('#')) {
        result.comment += `${result.comment ? '\n' : ''}${line}`;
      } else {
        result.content += `${result.content ? '\n' : ''}${line}`;
      }
    }

    if (result.comment || result.content) {
      blocks.push(result);
    }

    for (const block of blocks) {
      let root = this.codeParser.parse(block.content ?? '');
      for (const each of walks) {
        root = each(root);
      }
      block.ast = root;
    }

    return blocks as Block[];
  }
}
