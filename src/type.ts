export enum NodeType {
  ROOT = 'root',
  COLLECTION = 'ct',
  REPEAT_WRAP = 'rw',
  OPTIONAL = 'op',
  ENUM = 'em',
  GROUP = 'g',
  SPLIT = 's',
  REPEAT = 'r',
  DEFINITION = 'd',
  VARIABLE = 'v',
  BLANK = 'b',
  OTHER = 'o',
}

export interface CharType {
  char: string;
  decode: boolean;
  pos: number;
}

export interface Node {
  type: NodeType;
  content: string;
  start: number;
  end: number;
  children?: Node[];
  name?: string;
}

export interface Block {
  comment: string;
  content: string;
  ast: Node;
}
