import {
  createBatchColumns,
  createBooleanColumn,
  createCommonColumns,
  createCrudColumns,
  createCustomColumn,
  createDateColumn,
  createDescColumn,
  createIdColumn,
  createIndexColumn,
  createMoneyColumn,
  createNameColumn,
  createOperationColumn,
  createSearchColumns,
  createStatusColumn,
  filterColumns,
  findColumn,
  mergeColumns,
  moveColumn,
  removeColumn,
  updateColumn
} from "../columnFactories";

describe("column factories", () => {
  it("creates default and custom basic columns", () => {
    expect(createIdColumn()).toMatchObject({ prop: "id", minWidth: 80 });
    expect(createIdColumn({ prop: "uid", width: 120 })).toMatchObject({
      prop: "uid",
      minWidth: 120
    });
    expect(createNameColumn()).toMatchObject({ prop: "name", minWidth: 120 });
    expect(createNameColumn({ prop: "label", minWidth: 90 })).toMatchObject({
      prop: "label",
      minWidth: 90
    });
    expect(createDescColumn()).toMatchObject({ prop: "desc", minWidth: 120 });
    expect(createDescColumn({ prop: "note", minWidth: 80 })).toMatchObject({
      prop: "note",
      minWidth: 80
    });
    expect(createStatusColumn({})).toMatchObject({
      prop: "status",
      slot: "status",
      minWidth: 100
    });
    expect(createStatusColumn({ prop: "state", minWidth: 90 })).toMatchObject({
      prop: "state",
      minWidth: 90
    });
  });

  it("formats date, money, boolean and index cells", () => {
    const date = createDateColumn({ label: "日期", prop: "date" });
    expect(date.minWidth).toBe(160);
    expect(date.formatter?.({}, {}, "2026-11-02", 0)).toBeTruthy();
    expect(date.formatter?.({}, {}, new Date("2026-11-02"), 0)).toBeTruthy();
    expect(date.formatter?.({}, {}, 123, 0)).toBe("");

    const fen = createMoneyColumn({ label: "金额", prop: "amount", unit: 1 });
    expect(fen.formatter?.({}, {}, null, 0)).toBe("-");
    expect(fen.formatter?.({}, {}, undefined, 0)).toBe("-");
    expect(fen.formatter?.({}, {}, 12345, 0)).toBe("123.45");
    expect(fen.formatter?.({}, {}, "12345", 0)).toBe("123.45");
    expect(fen.formatter?.({}, {}, "bad", 0)).toBe("0.00");
    expect(fen.formatter?.({}, {}, "", 0)).toBe("0.00");
    expect(fen.formatter?.({}, {}, BigInt(12345), 0)).toBe("123.45");
    expect(
      createMoneyColumn({
        label: "金额",
        prop: "amount",
        unit: 100,
        decimals: 1
      }).formatter?.({}, {}, 12, 0)
    ).toBe("12.0");

    const bool = createBooleanColumn({ label: "启用", prop: "enabled" });
    expect(bool.formatter?.({}, {}, true, 0)).toBe("是");
    expect(bool.formatter?.({}, {}, false, 0)).toBe("否");
    expect(
      createBooleanColumn({
        label: "启用",
        prop: "enabled",
        trueText: "Y",
        falseText: "N",
        minWidth: 50,
        align: "left"
      }).formatter?.({}, {}, true, 0)
    ).toBe("Y");
    expect(createIndexColumn().formatter?.({}, {}, null, 4)).toBe("5");
    expect(createIndexColumn({ label: "No", width: 80 })).toMatchObject({
      label: "No",
      minWidth: 80
    });
  });

  it("builds operation and common columns for both option branches", () => {
    expect(createOperationColumn()).toMatchObject({
      label: "操作",
      fixed: "right",
      align: "center"
    });
    expect(
      createOperationColumn({
        label: "Actions",
        minWidth: 200,
        fixed: "left",
        align: "left"
      })
    ).toMatchObject({ label: "Actions", minWidth: 200, fixed: "left" });
    expect(createOperationColumn({ fixed: false }).fixed).toBeUndefined();

    expect(createCommonColumns()).toHaveLength(1);
    const common = createCommonColumns({
      showId: false,
      showDesc: true,
      descProp: "remark",
      showCreatedAt: true,
      createdAtProp: "created",
      showUpdatedAt: true,
      updatedAtProp: "updated",
      showDeletedAt: true,
      deletedAtProp: "deleted"
    });
    expect(common.map(column => column.prop)).toEqual([
      "remark",
      "created",
      "updated",
      "deleted"
    ]);
    expect(
      createCrudColumns([{ label: "名称", prop: "name" }], {
        commonColumns: { showId: false },
        operationColumn: { fixed: false }
      })
    ).toHaveLength(2);
  });

  it("passes through custom and search columns", () => {
    const custom = createCustomColumn({ label: "A", prop: "a", slot: "a" });
    expect(createBatchColumns([custom])).toEqual([custom]);
    expect(
      createSearchColumns([{ label: "A", prop: "a", type: "input" }])
    ).toHaveLength(1);
  });

  it("merges, filters, finds, updates, removes and moves columns", () => {
    const a = { label: "A", prop: "a" };
    const b = { label: "B", prop: "b" };
    const c = { label: "C", prop: "c" };
    expect(mergeColumns([a], [b, c])).toEqual([a, b, c]);
    expect(filterColumns([a, b], column => column.prop !== "a")).toEqual([b]);
    expect(findColumn([a, b], "b")).toBe(b);
    expect(findColumn([a], "missing")).toBeUndefined();
    expect(updateColumn([a, b], "b", { label: "Bee" })).toEqual([
      a,
      { ...b, label: "Bee" }
    ]);
    expect(removeColumn([a, b], "a")).toEqual([b]);
    expect(moveColumn([a, b, c], "a", 2)).toEqual([b, c, a]);
    expect(moveColumn([a, b], "missing", 0)).toEqual([a, b]);
  });
});
