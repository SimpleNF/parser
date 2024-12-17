export enum NodeType {
  ROOT = 'ROOT',
  COLLECTION = 'CT',
  OPTIONAL = 'OP',
  ENUM = 'EM',
  SPLIT = 'S',
  REPEAT = 'R',
  DEFINITION = 'D',
  VARIABLE = 'V',
  BLANK = 'B',
  OTHER = 'O'
}

export interface CharInfo {
  char: string;
  decode: boolean;
  pos: number;
}

export interface Node {
  type: NodeType;
  value: string;
  start: number;
  end: number;
  children?: Node[];
  name?: string
}