import { Node, ExchangeType, Block } from './type';

interface WalkOption {
  filter?: (node: Node, parent: Node) => boolean;
  exchangeType?: ExchangeType;
  exchange?: (node: Node, parent: Node) => Node | void;
  back?: (node: Node, parent: Node) => void;
}

const filterChildren = (children: Node[], parent: Node, filter: (node: Node, parent: Node) => boolean) => {
  for (const node of children) {
    if (node.children) {
      node.children = filterChildren(node.children, node, filter);
    }
  }

  return children.filter((each) => filter(each, parent));
};

const walkChildren = (
  children: Node[],
  parent: Node,
  exchange: (node: Node, parent: Node) => Node | void,
  back?: (node: Node, parent: Node) => void,
  exchangeType: ExchangeType = ExchangeType.BEFORE,
) => {
  return children.map((node) => {
    let newNode = node;

    if ([ExchangeType.BEFORE, ExchangeType.BOTH].includes(exchangeType)) {
      newNode = exchange(newNode, parent) ?? newNode;
    }

    if (newNode.children) {
      newNode.children = walkChildren(newNode.children, newNode, exchange, back, exchangeType);
    }

    if ([ExchangeType.AFTER, ExchangeType.BOTH].includes(exchangeType)) {
      newNode = exchange(newNode, parent) ?? newNode;
    }

    back?.(node, parent);

    return newNode;
  });
};

export const walk = (root: Node, option: WalkOption) => {
  let temp = root;

  if (!temp.children) return temp;

  if (option.exchange) {
    temp = {
      ...temp,
      children: walkChildren(temp.children, temp, option.exchange, option.back, option.exchangeType),
    };
  }

  if (!temp.children) return temp;

  if (option.filter) {
    temp = {
      ...temp,
      children: filterChildren(temp.children, temp, option.filter),
    };
  }

  return temp;
};

export const walkBlocks = (blocks: Block[], ...walks: ((node: Node) => Node)[]) => {
  return blocks.map((each) => {
    let newBlock = { ...each };
    for (const each of walks) {
      newBlock.ast = each(newBlock.ast);
    }

    return newBlock;
  });
};
