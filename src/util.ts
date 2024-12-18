import { ExchangeType, Node, NodeType } from './type';
import { walk } from './walk';

export const cleanBlank = (root: Node) => {
  return walk(root, {
    filter: (node) => node.type !== NodeType.BLANK,
  });
};

const cleanEnumInEnum = (node: Node) => {
  if (node.type !== NodeType.ENUM || !node.children) return node;

  if (node.children.length === 1 && node.children[0].type === NodeType.GROUP) {
    const group = node.children[0];

    if (group.children?.length === 1 && group.children[0].type === NodeType.ENUM) {
      return group.children[0];
    }
  }

  return node;
};

export const cleanEnum = (root: Node) => {
  return walk(root, {
    exchange: cleanEnumInEnum,
  });
};

const addEnumNodeName = (node: Node, parent: Node) => {
  if (node.type !== NodeType.ENUM || node.name) return node;

  const firstGroup = node.children!.find((each) => each.type === NodeType.GROUP);
  if (!firstGroup || !firstGroup.children) return node;

  const firstEnum = firstGroup.children.find((each) => each.type === NodeType.ENUM);
  if (firstEnum) {
    return {
      ...node,
      name: firstEnum.name,
    };
  }

  const firstVar = firstGroup.children.find((each) => each.type === NodeType.VARIABLE);
  if (firstVar) {
    return {
      ...node,
      name: firstVar.content,
    };
  }

  const defineNode = parent.children?.find((each) => each.type === NodeType.DEFINITION || each === node);

  if (defineNode && defineNode !== node) {
    return {
      ...node,
      name: defineNode.content,
    };
  }

  const lastDef = firstGroup.children.findLast((each) => each.type === NodeType.DEFINITION);
  if (lastDef) {
    return {
      ...node,
      name: lastDef.content,
    };
  }

  return node;
};

export const addEnumName = (root: Node) => {
  return walk(root, {
    exchangeType: ExchangeType.AFTER,
    exchange: addEnumNodeName,
  });
};

const addRepeatNodeName = (node: Node, parent: Node) => {
  if (!parent.children || node.type !== NodeType.REPEAT_WRAP || node.name) return node;

  const index = parent.children.findIndex((each) => each === node);
  if (!index || index < 1) return node;

  const prev = parent.children[index - 1];
  if (![NodeType.VARIABLE, NodeType.DEFINITION, NodeType.ENUM].includes(prev.type)) return node;

  return {
    ...node,
    name: (prev.name || prev.content) + 's',
  };
};

export const addRepeatName = (root: Node) => {
  return walk(root, {
    exchange: addRepeatNodeName,
  });
};
