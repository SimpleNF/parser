import { ExchangeType, Node, NodeType } from './type';
import { walk } from './walk';

export const cleanBlank = (root: Node) => {
  return walk(root, {
    filter: (node) => node.type !== NodeType.BLANK,
  });
};

export const copyNode = (root: Node) => {
  return walk(root, {
    exchange: (node) => ({ ...node }),
  });
};
