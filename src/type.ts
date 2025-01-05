export enum NodeType {
  ROOT = 'root',
  COLLECTION = 'ct',
  LOOP = 'lo',
  OPTIONAL = 'op',
  ENUM = 'em',
  GROUP = 'g',
  SPLIT = 's',
  REPEAT = 'r',
  DEFINITION = 'd',
  VARIABLE = 'v',
  BLANK = 'b',
  WRAP = 'w',
  OTHER = 'o',
}

export enum ExchangeType {
  BEFORE = 'b',
  AFTER = 'a',
  BOTH = 'ba',
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

  [key: string]: any;
}

export interface Block {
  comment: string;
  content: string;
  ast: Node;

  [key: string]: any;
}
