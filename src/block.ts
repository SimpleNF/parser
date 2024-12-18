import { CharType, Node, NodeType } from './type';

export class SBNFParser {
  private keywords: string[] = ['[', '{', '|', '}', ']'];
  private pos = 0;
  private input = '';
  private closeStack: string[] = [];

  parse(input: string) {
    this.pos = 0;
    this.input = input;
    this.closeStack = [];
    return this.parseExpression();
  }

  private next(): CharType {
    const now = this.pos;
    const char = this.input[this.pos];
    this.pos++;

    if (char === '\\') {
      const char = this.input[this.pos];
      this.pos++;
      return { char, decode: true, pos: now };
    }

    return { char, decode: false, pos: now };
  }

  private back() {
    if (this.input[this.pos - 2] === '\\') {
      this.pos -= 2;
    } else {
      this.pos -= 1;
    }
  }

  private parseExpression(): Node {
    return this.parseNode(NodeType.ROOT);
  }

  private parseNode(type: NodeType = NodeType.COLLECTION): Node {
    const nodes: Node[] = [];
    let start = -1;
    let end = -1;

    while (true) {
      const info = this.next();

      const char = info.char;
      if (!char) {
        if (this.closeStack.length > 0) {
          throw new Error('unclosed block');
        }
        break;
      }

      if (start === -1) {
        start = info.pos;
      }
      if (char === this.closeStack[this.closeStack.length - 1]) {
        end = info.pos;
        this.closeStack.pop();
        break;
      }

      if (char === '[') {
        this.closeStack.push(']');
        nodes.push(this.parseOptional());
      } else if (char === '{') {
        this.closeStack.push('}');
        nodes.push(this.parseEnum());
      } else if (this.isRepeatStartChar(info)) {
        this.back();
        nodes.push(this.parseString(NodeType.REPEAT, this.isRepeatChar, this.isBlankChar));
      } else if (this.isSplitStartChar(info)) {
        this.back();
        nodes.push(this.parseString(NodeType.SPLIT, this.isSplitChar, this.isBlankChar));
      } else if (this.isVariableStartChar(info)) {
        this.back();
        nodes.push(this.parseString(NodeType.VARIABLE, this.isVariableChar, this.isBlankChar));
      } else if (this.isDefinitionStartChar(info)) {
        this.back();
        nodes.push(this.parseString(NodeType.DEFINITION, this.isDefinitionChar, this.isBlankChar));
      } else if (this.isBlankChar(info)) {
        this.back();
        nodes.push(this.parseString(NodeType.BLANK, this.isBlankChar, this.isNotBlankChar));
      } else if (this.isOtherStartChar(info)) {
        this.back();
        nodes.push(this.parseString(NodeType.OTHER, this.isOtherChar, this.isBlankChar));
      } else if (!/\s/.test(char)) {
        throw new Error(`parse error position: ${info.pos} char: ${char}`);
      }
    }

    if (start === -1) {
      start = 0;
    }

    if (end === -1) {
      end = this.input.length;
    }

    return {
      type,
      content: this.input.slice(start, end),
      start,
      end,
      children: nodes,
    };
  }

  private isBlankChar = (char: CharType): boolean => {
    return /\s/.test(char.char);
  };

  private isNotBlankChar = (char: CharType): boolean => {
    return !/\s/.test(char.char);
  };

  private isRepeatStartChar = (char: CharType): boolean => {
    return char.char === '.' && this.input[this.pos] === '.' && this.input[this.pos + 1] === '.';
  };

  private isRepeatChar = (char: CharType): boolean => {
    return char.char === '.';
  };

  private isSplitStartChar = (char: CharType): boolean => {
    return char.char === '|';
  };

  private isSplitChar = (char: CharType): boolean => {
    return char.char === '|';
  };

  private isVariableStartChar = (char: CharType): boolean => {
    return /[a-z]/.test(char.char);
  };

  private isVariableChar = (char: CharType): boolean => {
    return /[a-z0-9_]/.test(char.char) || char.decode;
  };

  private isDefinitionStartChar = (char: CharType): boolean => {
    return /[A-Z]/.test(char.char);
  };

  private isDefinitionChar = (char: CharType): boolean => {
    return /[A-Z]/.test(char.char) || char.decode;
  };

  private isOtherStartChar = (char: CharType): boolean => {
    return /[^a-zA-Z0-9_\s]/.test(char.char) && !this.keywords.includes(char.char);
  };

  private isOtherChar = (char: CharType): boolean => {
    return /[^a-zA-Z0-9_\s]/.test(char.char) && (!this.keywords.includes(char.char) || char.decode);
  };

  private parseString(nodeType: NodeType, checkInner: (char: CharType) => boolean, checkEnd?: (char: CharType) => boolean): Node {
    let value = '';
    let start = -1;
    let end = -1;

    while (true) {
      const info = this.next();
      const char = info.char;
      if (start === -1) {
        start = info.pos;
      }

      if (!info.char) {
        end = info.pos;
        break;
      }

      if (checkEnd && checkEnd(info)) {
        end = info.pos;
        this.back();
        break;
      } else if (!checkInner(info)) {
        end = info.pos;
        this.back();
        break;
      } else {
        value += char;
      }
    }

    return {
      type: nodeType,
      content: value,
      start,
      end,
    };
  }

  private parseOptional(): Node {
    const node = this.parseName(this.parseNode(NodeType.OPTIONAL));
    const children = node.children ?? [];
    const content = node.content;

    const contentChildren = children.filter((each) => each.type !== NodeType.BLANK);
    if (contentChildren?.length === 1 && contentChildren[0].type === NodeType.ENUM) {
      return node;
    }

    if (contentChildren.some((node) => node.type === NodeType.REPEAT)) {
      return { ...node, type: NodeType.REPEAT_WRAP };
    }

    return {
      type: NodeType.OPTIONAL,
      content: content,
      start: node.start,
      end: node.end,
      children: [
        this.groupedEnumChildren({
          type: NodeType.ENUM,
          content: content,
          start: node.start,
          end: node.end,
          children: children,
          name: node.name,
        }),
      ],
    };
  }

  private parseEnum(): Node {
    const node = this.parseName(this.parseNode(NodeType.ENUM));
    return this.groupedEnumChildren(node);
  }

  private parseName(node: Node): Node {
    const children = node.children;
    if (!children || children.length === 0) return node;

    if ([NodeType.OPTIONAL, NodeType.ENUM].includes(node.type)) {
      const contentChildren = children.filter((each) => ![NodeType.BLANK].includes(each.type));
      const len = contentChildren?.length ?? 0;
      if (len > 3 && contentChildren[len - 2].content === 'as' && contentChildren[len - 1].type === NodeType.VARIABLE) {
        const name = contentChildren[len - 1].content;
        const index = children.findIndex((each) => each === contentChildren[len - 2]);
        return {
          ...node,
          children: children.slice(0, index),
          name,
        };
      }

      return node;
    }

    return node;
  }

  private groupedEnumChildren(node: Node): Node {
    if (!node.children) return node;

    let grouped: Node[] = [];
    let current: Node = {
      type: NodeType.GROUP,
      content: '',
      start: -1,
      end: -1,
      children: [],
    };

    for (const each of node.children) {
      if (each.type === NodeType.SPLIT) {
        grouped.push(current);
        current = {
          type: NodeType.GROUP,
          content: '',
          start: -1,
          end: -1,
          children: [],
        };
      } else {
        if (current.start === -1) {
          current.start = each.start;
        }
        current.end = each.end;
        current.children!.push(each);
      }
    }

    if (current.children?.length) {
      grouped.push(current);
    }

    grouped = grouped.map((each) => (each.children?.length === 1 ? each.children[0] : each));

    return {
      ...node,
      children: grouped,
    };
  }
}
