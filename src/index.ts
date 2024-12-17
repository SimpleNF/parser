import { CharInfo, Node, NodeType } from './type';

export class SBNFParser {
  private keywords: string[] = ['[', '{', '|', '}', ']', '.'];
  private lastPos = -1;
  private pos = 0;
  private input = '';
  private closeStack: string[] = [];
  private nameMap = new Map<string, boolean>();

  parse(input: string) {
    this.lastPos = -1
    this.pos = 0;
    this.input = input;
    this.closeStack = []
    this.nameMap = new Map()
    return this.parseExpression();
  }

  private next(): CharInfo {
    this.lastPos = this.pos;
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

  private back(): void {
    this.pos = this.lastPos;
  }

  private parseExpression(): Node {
    return this.parseNode(NodeType.ROOT);
  }

  private parseNode(type: NodeType = NodeType.COLLECTION): Node {
    const nodes: Node[] = [];
    let start = -1;
    let end = -1;

    while (true) {
      const info = this.next()

      const char = info.char
      if (!char) {
        if (this.closeStack.length > 0) {
          throw new Error('unclosed block');
        }
        break;
      }

      if (start === -1) {
        start = info.pos
      }
      if (char === this.closeStack[this.closeStack.length - 1]) {
        end = info.pos
        this.closeStack.pop()
        break
      }

      if (char === '[') {
        this.closeStack.push(']');
        nodes.push(this.parseOptional());
      } else if (char === '{') {
        this.closeStack.push('}');
        nodes.push(this.parseEnum());
      } else if (this.isRepeatStartChar(info)) {
        this.back()
        nodes.push(this.parseString(NodeType.REPEAT, this.isRepeatChar, this.isBlankChar))
      } else if (this.isSplitStartChar(info)) {
        this.back()
        nodes.push(this.parseString(NodeType.SPLIT, this.isSplitChar, this.isBlankChar))
      } else if (this.isVariableStartChar(info)) {
        this.back()
        nodes.push(this.parseString(NodeType.VARIABLE, this.isVariableChar, this.isBlankChar))
      } else if (this.isDefinitionStartChar(info)) {
        this.back()
        nodes.push(this.parseString(NodeType.DEFINITION, this.isDefinitionChar, this.isBlankChar))
      } else if (this.isBlankChar(info)) {
        this.back()
        nodes.push(this.parseString(NodeType.BLANK, this.isBlankChar, this.isNotBlankChar))
      } else if (this.isOtherStartChar(info)) {
        this.back()
        nodes.push(this.parseString(NodeType.OTHER, this.isOtherChar, this.isBlankChar))
      } else if (!/\s/.test(char)) {
        throw new Error(`parse error position: ${info.pos} char: ${char}`);
      }
    }

    if (end === -1) {
      end = this.input.length
    }

    return {
      type,
      value: this.input.slice(start, end),
      start,
      end,
      children: nodes,
    };
  }

  private isBlankChar = (char: CharInfo): boolean => {
    return /\s/.test(char.char)
  }

  private isNotBlankChar = (char: CharInfo): boolean => {
    return !/\s/.test(char.char)
  }

  private isRepeatStartChar = (char: CharInfo): boolean => {
    return /\./.test(char.char)
  }

  private isRepeatChar = (char: CharInfo): boolean => {
    return /\./.test(char.char)
  }

  private isSplitStartChar = (char: CharInfo): boolean => {
    return /\|/.test(char.char)
  }

  private isSplitChar = (char: CharInfo): boolean => {
    return /\|/.test(char.char)
  }

  private isVariableStartChar = (char: CharInfo): boolean => {
    return /[a-z]/.test(char.char)
  }

  private isVariableChar = (char: CharInfo): boolean => {
    return /[a-z0-9_]/.test(char.char) || char.decode
  }

  private isDefinitionStartChar = (char: CharInfo): boolean => {
    return /[A-Z]/.test(char.char);
  }

  private isDefinitionChar = (char: CharInfo): boolean => {
    return /[A-Z]/.test(char.char) || char.decode;
  }

  private isOtherStartChar = (char: CharInfo): boolean => {
    return /[^a-zA-Z0-9_\s]/.test(char.char) && !this.keywords.includes(char.char);
  }

  private isOtherChar = (char: CharInfo): boolean => {
    return /[^a-zA-Z0-9_\s]/.test(char.char) && (!this.keywords.includes(char.char) || char.decode);
  }

  private parseString(nodeType: NodeType, checkInner: (char: CharInfo) => boolean, checkEnd?: (char: CharInfo) => boolean): Node {
    let value = '';
    let start = -1;
    let end = -1;

    while (true) {
      const info = this.next()
      const char = info.char
      if (start === -1) {
        start = info.pos
      }

      if (!info.char) {
        end = info.pos
        break
      }

      if (checkEnd && checkEnd(info)) {
        end = info.pos
        this.back()
        break
      }
      else if (!checkInner(info)) {
        end = info.pos
        this.back()
        break
      }
      else {
        value += char
      }
    }

    return {
      type: nodeType,
      value,
      start,
      end
    };
  }

  private parseOptional(): Node {
    const node = this.parseName(this.parseNode(NodeType.OPTIONAL));
    const children = node.children ?? []
    const content = node.value

    if (node.children?.length === 1 && node.children[0].type === NodeType.ENUM) {
      return node;
    }

    return {
      type: NodeType.OPTIONAL,
      value: content,
      start: node.start,
      end: node.end,
      children: [this.groupedEnumChildren({
        type: NodeType.ENUM,
        value: content,
        start: node.start,
        end: node.end,
        children: children,
        name: node.name
      })]
    };
  }

  private parseEnum(): Node {
    const node = this.parseName(this.parseNode(NodeType.ENUM))
    return this.groupedEnumChildren(node)
  }

  private parseName(node: Node): Node {
    if ([NodeType.COLLECTION, NodeType.OPTIONAL, NodeType.ENUM].includes(node.type)) {
      const children = node.children
      if (!children || children.length === 0) return node

      const len = children?.length ?? 0
      if (len > 3 && children[len - 2].value.trim() === 'as' && children[len - 1].type === NodeType.VARIABLE) {
        const name = children[len - 1].value.trim()
        this.nameMap.set(name, true);
        return {
          ...node,
          children: children.slice(0, -2),
          name
        }
      }

      let name = ''
      // pick all VARIABLE
      name = children.filter(each => each.type === NodeType.VARIABLE).map(each => each.value).join('_')

      // pick last DEFINITION
      if (!name) {
        for (const current of children.reverse()) {
          if (current.type === NodeType.DEFINITION) {
            const word = current.value.toLowerCase()
            if (!this.nameMap.has(word)) {
              name = word
              break
            }
          }
        }
      }

      // pick all DEFINITION
      if (!name && children.every(each => each.type === NodeType.DEFINITION)) {
        name = children.map(each => each.value).join('_').toLowerCase()
      }

      // finally pick all type
      if (!name || this.nameMap.has(name)) {
        for (const current of children) {
          name += this.typeToString(current)
        }
      }

      this.nameMap.set(name, true);
      return {
        ...node,
        name
      }
    }

    return node
  }

  private typeToString(node: Node): string {
    switch (node.type) {
      case NodeType.COLLECTION: return '{}'
      case NodeType.ENUM: return '{}'
      case NodeType.OPTIONAL: return '[]'
      case NodeType.SPLIT: return '|'
      case NodeType.DEFINITION: return node.value.trim().split(/\s+/).join('_')
      case NodeType.VARIABLE: return node.value.trim()
      default: return ''
    }
  }

  private groupedEnumChildren(node: Node): Node {
    if (!node.children) return node

    let grouped: Node[] = []
    let current: Node = {
      type: NodeType.COLLECTION,
      value: '',
      start: -1,
      end: -1,
      children: []
    }

    for (const each of node.children) {
      if (each.type === NodeType.SPLIT) {
        grouped.push(current);
        current = {
          type: NodeType.COLLECTION,
          value: '',
          start: -1,
          end: -1,
          children: []
        }
      } else {
        if (current.start === -1) {
          current.start = each.start
        }
        current.end = each.end
        current.children!.push(each)
      }
    }

    if (current.children?.length) {
      grouped.push(current);
    }

    grouped = grouped.map(each => each.children?.length === 1 ? each.children[0] : each)

    return {
      ...node,
      children: grouped
    }
  }
}