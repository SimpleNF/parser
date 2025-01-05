import { ExchangeType, Node, NodeType } from './type';
import { walk } from './walk';

export const cleanBlank = (root: Node) => {
  return walk(root, {
    filter: (node) => node.type !== NodeType.BLANK,
  });
};

const addEnumNodeName = (node: Node, parent: Node) => {
  if (node.type !== NodeType.ENUM || node.name) return node;

  const defineNode = parent.children?.find((each) => each.type === NodeType.DEFINITION || each === node);

  if (defineNode && defineNode !== node && !parent.children?.some((each) => each.name === defineNode.content)) {
    node.name = defineNode.content;
    return node;
  }

  const firstGroup = node.children!.find((each) => each.type === NodeType.GROUP);
  if (!firstGroup || !firstGroup.children) return node;

  const firstDef = firstGroup.children.find((each) => each.type === NodeType.DEFINITION);
  if (firstDef) {
    node.name = firstDef.content;
    return node;
  }

  const firstVar = firstGroup.children.find((each) => each.type === NodeType.VARIABLE);
  if (firstVar) {
    node.name = firstVar.content;
    return node;
  }

  const firstEnum = firstGroup.children.find((each) => each.type === NodeType.ENUM);
  if (firstEnum) {
    node.name = firstEnum.name;
    return node;
  }

  return node;
};

export const addEnumName = (root: Node) => {
  return walk(root, {
    exchangeType: ExchangeType.AFTER,
    exchange: addEnumNodeName,
  });
};

const addLoopNodeName = (node: Node, parent: Node) => {
  if (!parent.children || node.type !== NodeType.LOOP || node.name) return node;

  const index = parent.children.findIndex((each) => each === node);
  if (!index || index < 1) return node;

  for (let i = index - 1; i >= 0; i--) {
    const prev = parent.children[i];
    if ([NodeType.VARIABLE, NodeType.DEFINITION, NodeType.ENUM].includes(prev.type)) {
      node.name = (prev.name || prev.content) + 's';
      return node;
    }
  }

  return node;
};

export const addLoopName = (root: Node) => {
  return walk(root, {
    exchange: addLoopNodeName,
  });
};

export const copyNode = (root: Node) => {
  return walk(root, {
    exchange: (node) => ({ ...node }),
  });
};
