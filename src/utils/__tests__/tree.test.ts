import { describe, it, expect, vi } from "vitest";
import {
  buildHierarchyTree,
  extractPathList,
  deleteChildren,
  getNodeByUniqueId,
  appendFieldByUniqueId,
  handleTree,
  type TreeNode
} from "../tree";

describe("tree utils", () => {
  describe("buildHierarchyTree", () => {
    it("should build hierarchy for flat array", () => {
      const tree: TreeNode[] = [{ name: "root" }];
      const result = buildHierarchyTree(tree);
      expect(result[0].id).toBe(0);
      expect(result[0].parentId).toBeNull();
      expect(result[0].pathList).toEqual([0]);
    });

    it("should handle nested children", () => {
      const tree: TreeNode[] = [
        {
          name: "parent",
          children: [{ name: "child" }]
        }
      ];
      const result = buildHierarchyTree(tree);
      expect(result[0].id).toBe(0);
      expect(result[0].children?.[0].parentId).toBe(0);
      expect(result[0].children?.[0].pathList).toEqual([0, 0]);
    });

    it("should return empty array for invalid input", () => {
      // @ts-expect-error testing invalid input
      expect(buildHierarchyTree(null)).toEqual([]);
      expect(buildHierarchyTree([])).toEqual([]);
    });

    it("should warn and return empty array for non-array input", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });
      // @ts-expect-error testing invalid input
      buildHierarchyTree("not an array");
      expect(consoleSpy).toHaveBeenCalledWith("tree must be an array");
      consoleSpy.mockRestore();
    });
  });

  describe("extractPathList", () => {
    it("should extract uniqueIds from tree", () => {
      const tree: TreeNode[] = [
        { uniqueId: 1 },
        { uniqueId: 2, children: [{ uniqueId: 3 }] }
      ];
      const result = extractPathList(tree);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
    });

    it("should return empty array for empty tree", () => {
      expect(extractPathList([])).toEqual([]);
    });
  });

  describe("deleteChildren", () => {
    it("should delete single child and create uniqueId", () => {
      const tree: TreeNode[] = [
        { name: "parent", children: [{ name: "only-child" }] }
      ];
      const result = deleteChildren(tree);
      expect(result[0].children).toBeUndefined();
      expect(result[0].uniqueId).toBeDefined();
    });

    it("should keep multiple children", () => {
      const tree: TreeNode[] = [
        {
          name: "parent",
          children: [{ name: "child1" }, { name: "child2" }]
        }
      ];
      const result = deleteChildren(tree);
      expect(result[0].children).toHaveLength(2);
    });
  });

  describe("getNodeByUniqueId", () => {
    it("should find node by uniqueId", () => {
      const tree: TreeNode[] = [
        { uniqueId: 1, name: "first" },
        { uniqueId: 2, name: "second" }
      ];
      const result = getNodeByUniqueId(tree, 2);
      expect(result?.name).toBe("second");
    });

    it("should find nested node by uniqueId", () => {
      const tree: TreeNode[] = [
        {
          uniqueId: 1,
          children: [{ uniqueId: 2, name: "nested" }]
        }
      ];
      const result = getNodeByUniqueId(tree, 2);
      expect(result?.name).toBe("nested");
    });

    it("should return null for non-existent uniqueId", () => {
      const tree: TreeNode[] = [{ uniqueId: 1 }];
      expect(getNodeByUniqueId(tree, 999)).toBeNull();
    });
  });

  describe("appendFieldByUniqueId", () => {
    it("should append fields to node with matching uniqueId", () => {
      const tree: TreeNode[] = [{ uniqueId: 1, name: "test" }];
      const result = appendFieldByUniqueId(tree, 1, { extra: "value" });
      expect(result[0].extra).toBe("value");
    });

    it("should append fields to nested node", () => {
      const tree: TreeNode[] = [
        {
          uniqueId: 1,
          children: [{ uniqueId: 2, name: "nested" }]
        }
      ];
      const result = appendFieldByUniqueId(tree, 2, { extra: "nested-value" });
      expect(result[0].children?.[0].extra).toBe("nested-value");
    });
  });

  describe("handleTree", () => {
    it("should convert flat array to tree structure", () => {
      const data = [
        { id: 1, parentId: null, name: "root" },
        { id: 2, parentId: 1, name: "child1" },
        { id: 3, parentId: 1, name: "child2" }
      ];
      const result = handleTree(data);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("root");
      expect(
        (result[0] as unknown as { children: unknown[] }).children
      ).toHaveLength(2);
    });

    it("should handle empty data", () => {
      expect(handleTree([])).toEqual([]);
    });

    it("should use custom field names", () => {
      const data = [
        { uid: 1, parent: null, name: "root" },
        { uid: 2, parent: 1, name: "child" }
      ];
      const result = handleTree(data, "uid", "parent", "items");
      expect(result).toHaveLength(1);
      expect((result[0] as unknown as { items: unknown[] }).items).toHaveLength(
        1
      );
    });
  });
});
