import { Node } from './type';

interface WalkOption {
  filter?: (node: Node, parent: Node) => boolean;
  exchange?: (node: Node, parent: Node) => Node | void;
}

const filterChildren = (children: Node[], parent: Node, filter: (node: Node, parent: Node) => boolean) => {
  for (const node of children) {
    if (node.children) {
      node.children = filterChildren(node.children, node, filter);
    }
  }

  return children.filter((each) => filter(each, parent));
};

const walkChildren = (children: Node[], parent: Node, exchange: (node: Node, parent: Node) => Node | void) => {
  for (const node of children) {
    if (node.children) {
      node.children = walkChildren(node.children, node, exchange);
    }
  }

  return children.map((node) => exchange(node, parent) ?? node);
};

export const walk = (root: Node, option: WalkOption) => {
  let temp = root;

  if (!temp.children) return temp;

  if (option.filter) {
    temp = {
      ...temp,
      children: filterChildren(temp.children, temp, option.filter),
    };
  }

  if (!temp.children) return temp;

  if (option.exchange) {
    temp = {
      ...temp,
      children: walkChildren(temp.children, temp, option.exchange),
    };
  }

  return temp;
};
