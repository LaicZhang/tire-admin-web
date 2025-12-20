/**
 * 树节点基础接口
 */
export interface TreeNode {
  id?: string | number;
  parentId?: string | number | null;
  children?: TreeNode[];
  uniqueId?: string | number;
  pathList?: (string | number)[];
  [key: string]: unknown;
}

/**
 * @description 提取菜单树中的每一项uniqueId
 * @param tree 树
 * @returns 每一项uniqueId组成的数组
 */
export const extractPathList = <T extends TreeNode>(
  tree: T[]
): (string | number)[] => {
  if (!Array.isArray(tree)) {
    console.warn("tree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  const expandedPaths: (number | string)[] = [];
  for (const node of tree) {
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      expandedPaths.push(...extractPathList(node.children as T[]));
    }
    if (node.uniqueId !== undefined) {
      expandedPaths.push(node.uniqueId);
    }
  }
  return expandedPaths;
};

/**
 * @description 如果父级下children的length为1，删除children并自动组建唯一uniqueId
 * @param tree 树
 * @param pathList 每一项的id组成的数组
 * @returns 组件唯一uniqueId后的树
 */
export const deleteChildren = <T extends TreeNode>(
  tree: T[],
  pathList: (string | number)[] = []
): T[] => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  for (const [key, node] of tree.entries()) {
    if (node.children && node.children.length === 1) delete node.children;
    node.id = key;
    node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
    node.pathList = [...pathList, node.id];
    node.uniqueId =
      node.pathList.length > 1 ? node.pathList.join("-") : node.pathList[0];
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      deleteChildren(node.children as T[], node.pathList);
    }
  }
  return tree;
};

/**
 * @description 创建层级关系
 * @param tree 树
 * @param pathList 每一项的id组成的数组
 * @returns 创建层级关系后的树
 */
export const buildHierarchyTree = <T extends TreeNode>(
  tree: T[],
  pathList: (string | number)[] = []
): T[] => {
  if (!Array.isArray(tree)) {
    console.warn("tree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  for (const [key, node] of tree.entries()) {
    node.id = key;
    node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
    node.pathList = [...pathList, node.id];
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      buildHierarchyTree(node.children as T[], node.pathList);
    }
  }
  return tree;
};

/**
 * @description 广度优先遍历，根据唯一uniqueId找当前节点信息
 * @param tree 树
 * @param uniqueId 唯一uniqueId
 * @returns 当前节点信息
 */
export const getNodeByUniqueId = <T extends TreeNode>(
  tree: T[],
  uniqueId: number | string
): T | null => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return null;
  }
  if (!tree || tree.length === 0) return null;
  const item = tree.find(node => node.uniqueId === uniqueId);
  if (item) return item;
  const childrenList = tree
    .filter(node => node.children)
    .map(i => i.children)
    .flat(1) as T[];
  return getNodeByUniqueId(childrenList, uniqueId);
};

/**
 * @description 向当前唯一uniqueId节点中追加字段
 * @param tree 树
 * @param uniqueId 唯一uniqueId
 * @param fields 需要追加的字段
 * @returns 追加字段后的树
 */
export const appendFieldByUniqueId = <T extends TreeNode>(
  tree: T[],
  uniqueId: number | string,
  fields: Partial<T>
): T[] => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  for (const node of tree) {
    const hasChildren = node.children && node.children.length > 0;
    if (
      node.uniqueId === uniqueId &&
      Object.prototype.toString.call(fields) === "[object Object]"
    )
      Object.assign(node, fields);
    if (hasChildren) {
      appendFieldByUniqueId(node.children as T[], uniqueId, fields);
    }
  }
  return tree;
};

/**
 * @description 构造树型结构数据
 * @param data 数据源
 * @param id id字段 默认id
 * @param parentId 父节点字段，默认parentId
 * @param children 子节点字段，默认children
 * @returns 追加字段后的树
 */
export const handleTree = <T extends Record<string, unknown>>(
  data: T[],
  id?: string,
  parentId?: string,
  children?: string
): T[] => {
  if (!Array.isArray(data)) {
    console.warn("data must be an array");
    return [];
  }
  const config = {
    id: id || "id",
    parentId: parentId || "parentId",
    childrenList: children || "children"
  };

  const childrenListMap: Record<string, T[]> = {};
  const nodeIds: Record<string, T> = {};
  const tree: T[] = [];

  for (const d of data) {
    const parentIdValue = d[config.parentId] as string;
    if (childrenListMap[parentIdValue] == null) {
      childrenListMap[parentIdValue] = [];
    }
    nodeIds[d[config.id] as string] = d;
    childrenListMap[parentIdValue].push(d);
  }

  for (const d of data) {
    const parentIdValue = d[config.parentId] as string;
    if (nodeIds[parentIdValue] == null) {
      tree.push(d);
    }
  }

  for (const t of tree) {
    adaptToChildrenList(t);
  }

  function adaptToChildrenList(o: T) {
    const idValue = o[config.id] as string;
    if (childrenListMap[idValue] !== undefined) {
      (o as Record<string, unknown>)[config.childrenList] =
        childrenListMap[idValue];
    }
    const childList = o[config.childrenList] as T[] | undefined;
    if (childList) {
      for (const c of childList) {
        adaptToChildrenList(c);
      }
    }
  }
  return tree;
};
