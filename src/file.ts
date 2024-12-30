import { SNFParser } from './block';
import { Block, Node } from './type';

export class SNFFileParser {
  private codeParser = new SNFParser();

  async parse(content: string, ...walks: ((node: Node) => Node)[]) {
    const lines = content.split('\n');

    let blocks: Partial<Block>[] = [];
    let result = { comment: '', content: '', name: '' };

    for (const line of lines) {
      if (!line.trim()) {
        if (result.comment || result.content) {
          blocks.push(result);
        }
        result = { comment: '', content: '', name: '' };
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
