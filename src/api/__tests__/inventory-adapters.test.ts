import {
  buildAssemblyCreatePayload,
  buildAssemblyUpdatePayload,
  buildBomPayload,
  buildDisassemblyCreatePayload,
  buildDisassemblyUpdatePayload,
  buildOtherInboundCreatePayload,
  buildOtherInboundUpdatePayload,
  buildOtherOutboundCreatePayload,
  buildOtherOutboundUpdatePayload,
  filterInventoryDocuments,
  mapAssemblyOrderRecord,
  mapAssemblyOrderToDisassembly,
  mapAssemblyOrderToInventoryDocument,
  mapBomRecord,
  mapCostAdjustToInventoryDocument,
  mapInventoryCheckToInventoryDocument,
  mapOtherInboundToInventoryDocument,
  mapOtherOutboundToInventoryDocument,
  mapSurplusOrderToOtherInbound,
  mapTransferOrderToInventoryDocument,
  mapWasteOrderToOtherOutbound,
  type RawAssemblyOrder,
  type RawBom,
  type RawSurplusOrder,
  type RawWasteOrder
} from "@/api/inventory-adapters";
import {
  DocumentStatus,
  DocumentType
} from "@/views/inventory/documents/types";
import { AssemblyOrderStatus } from "@/views/inventory/assembly/types";
import { DisassemblyOrderStatus } from "@/views/inventory/disassembly/types";
import {
  OtherInboundStatus,
  OtherInboundType
} from "@/views/inventory/otherInbound/types";
import {
  OtherOutboundStatus,
  OtherOutboundType
} from "@/views/inventory/otherOutbound/types";

const bom = (overrides: Partial<RawBom> = {}): RawBom => ({
  id: 1,
  uid: "bom-1",
  name: "Seat assembly",
  targetTireId: "tire-target",
  targetQuantity: 2,
  status: "approved",
  isApproved: true,
  createdAt: "2026-01-01T00:00:00Z",
  details: [
    { id: 5, uid: "detail-1", tireId: "tire-part", quantity: 3, remark: "part" }
  ],
  ...overrides
});

const assembly = (
  overrides: Partial<RawAssemblyOrder> = {}
): RawAssemblyOrder => ({
  id: 11,
  uid: "assembly-1",
  number: 0,
  docNo: "DOC-11",
  repoId: "repo-1",
  operatorId: "user-1",
  auditorId: null,
  createAt: "2026-02-01T10:00:00Z",
  updateAt: "2026-02-02T10:00:00Z",
  isApproved: false,
  isLocked: false,
  desc: "assembly order",
  repo: { uid: "repo-1", name: "Main warehouse" },
  operator: { uid: "user-1", name: "Alice" },
  details: [
    {
      id: 1,
      tireId: "part-a",
      count: 2,
      desc: "used",
      tire: { uid: "part-a", name: "Part A", barcode: "PA" }
    },
    {
      id: 2,
      tireId: "target",
      count: 1,
      isResult: true,
      tire: { uid: "target", name: "Target", barcode: "TG" }
    },
    { id: 3, tireId: "part-b", count: 4 }
  ],
  ...overrides
});

const surplus = (
  overrides: Partial<RawSurplusOrder> = {}
): RawSurplusOrder => ({
  id: 21,
  uid: "surplus-1",
  number: 1002n,
  operatorId: "user-2",
  auditorId: "auditor-2",
  createAt: "2026-03-01T00:00:00Z",
  isApproved: true,
  details: [
    {
      id: 7,
      uid: "line-1",
      tireId: "tire-1",
      repoId: "repo-1",
      count: 3,
      unitPrice: "2.5",
      tire: { name: "Spare" },
      repo: { name: "Repo" }
    }
  ],
  ...overrides
});

const waste = (overrides: Partial<RawWasteOrder> = {}): RawWasteOrder => ({
  id: 31,
  uid: "waste-1",
  number: 1003,
  operatorId: "user-3",
  createAt: "2026-04-01T00:00:00Z",
  isApproved: false,
  rejectReason: "damaged",
  details: [
    {
      id: 9,
      tireId: "tire-2",
      repoId: "repo-2",
      count: 2,
      unitPrice: 4,
      tire: { name: "Worn" },
      repo: { name: "Bin" }
    }
  ],
  ...overrides
});

describe("inventory adapters", () => {
  it("maps BOM records with numeric conversions and payload defaults", () => {
    const mapped = mapBomRecord(
      bom({ estimatedMaterialCost: 12n, code: undefined })
    );
    expect(mapped).toMatchObject({
      uid: "bom-1",
      code: "",
      estimatedMaterialCost: 12,
      components: [{ tireId: "tire-part", quantity: 3, _uid: "detail-1" }]
    });
    expect(
      mapBomRecord(bom({ estimatedMaterialCost: "8.5" })).estimatedMaterialCost
    ).toBe(8.5);
    expect(
      mapBomRecord(bom({ estimatedMaterialCost: "bad" })).estimatedMaterialCost
    ).toBe(0);
    expect(
      mapBomRecord(bom({ estimatedMaterialCost: null })).estimatedMaterialCost
    ).toBe(0);

    expect(
      buildBomPayload({
        name: "BOM",
        targetTireId: "tire",
        targetQuantity: 1,
        components: [
          { tireId: "part", quantity: 2, remark: "note" },
          { tireId: "part-2", quantity: 1 }
        ]
      })
    ).toEqual({
      name: "BOM",
      code: undefined,
      targetTireId: "tire",
      targetQuantity: 1,
      version: undefined,
      remark: undefined,
      details: [
        { tireId: "part", quantity: 2, remark: "note" },
        { tireId: "part-2", quantity: 1, remark: undefined }
      ]
    });
    expect(
      buildBomPayload({
        name: "BOM",
        targetTireId: "tire",
        targetQuantity: 1,
        code: "C",
        version: "v1",
        remark: "r"
      })
    ).toMatchObject({ code: "C", version: "v1", remark: "r", details: [] });
  });

  it("maps assembly records into both order shapes with status variants", () => {
    const record = mapAssemblyOrderRecord(assembly());
    expect(record).toMatchObject({
      orderNumber: "DOC-11",
      targetTireId: "target",
      targetTireName: "Target",
      targetRepoName: "Main warehouse",
      quantity: 1,
      status: AssemblyOrderStatus.PENDING,
      isApproved: false,
      operatorName: "Alice",
      auditorId: undefined,
      components: [
        {
          tireId: "part-a",
          quantity: 2,
          repoId: "repo-1",
          tireName: "Part A",
          remark: "used"
        },
        { tireId: "part-b", quantity: 4 }
      ]
    });
    expect(mapAssemblyOrderRecord(assembly({ isApproved: true })).status).toBe(
      AssemblyOrderStatus.APPROVED
    );
    expect(
      mapAssemblyOrderRecord(assembly({ rejectReason: "no" })).status
    ).toBe(AssemblyOrderStatus.REJECTED);
    expect(
      mapAssemblyOrderRecord(assembly({ docNo: null, number: 77n })).orderNumber
    ).toBe("77");
    expect(
      mapAssemblyOrderRecord(assembly({ docNo: null, number: "" })).orderNumber
    ).toBe("assembly-1");
    expect(
      mapAssemblyOrderRecord(
        assembly({ uid: null, docNo: null, number: undefined })
      ).orderNumber
    ).toBe("");
    expect(
      mapAssemblyOrderRecord(assembly({ details: undefined })).components
    ).toEqual([]);

    const disassembly = mapAssemblyOrderToDisassembly(
      assembly({ isApproved: true })
    );
    expect(disassembly).toMatchObject({
      sourceTireId: "target",
      sourceTireName: "Target",
      sourceRepoId: "repo-1",
      quantity: 1,
      status: DisassemblyOrderStatus.APPROVED,
      isApproved: true,
      uid: "assembly-1",
      components: [{ tireId: "part-a" }, { tireId: "part-b" }]
    });
    expect(
      mapAssemblyOrderToDisassembly(assembly({ rejectReason: "bad" })).status
    ).toBe(DisassemblyOrderStatus.REJECTED);
    expect(mapAssemblyOrderToDisassembly(assembly()).status).toBe(
      DisassemblyOrderStatus.PENDING
    );
    expect(
      mapAssemblyOrderToDisassembly(assembly({ details: undefined }))
        .sourceTireId
    ).toBe("");
  });

  it("builds assembly and disassembly payloads", () => {
    const data = {
      targetTireId: "target",
      targetRepoId: "repo",
      quantity: 1,
      remark: " build ",
      components: [{ tireId: "part", quantity: 2, remark: "" }]
    };
    const create = buildAssemblyCreatePayload(
      data,
      "company",
      "user",
      "new-uid"
    );
    expect(create.order).toMatchObject({
      uid: "new-uid",
      type: "ASSEMBLY",
      desc: " build ",
      repo: { connect: { uid: "repo" } }
    });
    expect(create.details).toEqual([
      {
        companyId: "company",
        tireId: "part",
        count: 2,
        desc: null,
        isResult: false
      },
      {
        companyId: "company",
        tireId: "target",
        count: 1,
        desc: " build ",
        isResult: true
      }
    ]);
    expect(buildAssemblyUpdatePayload(data, "company", "user").details).toEqual(
      { deleteMany: {}, createMany: { data: create.details } }
    );
    expect(
      buildAssemblyCreatePayload({ ...data, remark: "   " }, "c", "u", "x")
        .order.desc
    ).toBeNull();

    const dis = {
      sourceTireId: "source",
      sourceRepoId: "repo",
      quantity: 5,
      components: [{ tireId: "part", quantity: 2 }]
    };
    const disCreate = buildDisassemblyCreatePayload(
      dis,
      "company",
      "user",
      "uid-2"
    );
    expect(disCreate.order).toMatchObject({
      type: "DISASSEMBLY",
      repo: { connect: { uid: "repo" } },
      desc: null
    });
    expect(disCreate.details).toEqual([
      {
        companyId: "company",
        tireId: "source",
        count: 5,
        desc: null,
        isResult: true
      },
      {
        companyId: "company",
        tireId: "part",
        count: 2,
        desc: null,
        isResult: false
      }
    ]);
    expect(
      buildDisassemblyUpdatePayload(dis, "company", "user").details
    ).toEqual({ deleteMany: {}, createMany: { data: disCreate.details } });
  });

  it("maps surplus and waste orders with totals and status variants", () => {
    const inbound = mapSurplusOrderToOtherInbound(surplus());
    expect(inbound).toMatchObject({
      type: OtherInboundType.SURPLUS,
      status: OtherInboundStatus.APPROVED,
      orderNumber: "1002",
      totalAmount: 7.5,
      totalQuantity: 3,
      details: [
        { tireName: "Spare", repoName: "Repo", unitCost: 2.5, totalCost: 7.5 }
      ]
    });
    expect(
      mapSurplusOrderToOtherInbound(surplus({ isApproved: undefined })).status
    ).toBe(OtherInboundStatus.PENDING);
    expect(
      mapSurplusOrderToOtherInbound(surplus({ rejectReason: "x" })).status
    ).toBe(OtherInboundStatus.REJECTED);
    expect(
      mapSurplusOrderToOtherInbound(surplus({ details: undefined })).totalAmount
    ).toBe(0);

    const outbound = mapWasteOrderToOtherOutbound(waste());
    expect(outbound).toMatchObject({
      type: OtherOutboundType.WASTE,
      status: OtherOutboundStatus.REJECTED,
      totalAmount: 8,
      totalQuantity: 2,
      details: [{ remark: undefined, unitCost: 4, totalCost: 8 }]
    });
    expect(
      mapWasteOrderToOtherOutbound(
        waste({ rejectReason: undefined, isApproved: true })
      ).status
    ).toBe(OtherOutboundStatus.APPROVED);
    expect(
      mapWasteOrderToOtherOutbound(
        waste({ rejectReason: undefined, isApproved: undefined })
      ).status
    ).toBe(OtherOutboundStatus.PENDING);
  });

  it("builds inbound and outbound payloads including generated row ids", () => {
    const inbound = {
      type: OtherInboundType.OTHER_INBOUND,
      remark: "",
      details: [
        { tireId: "t", repoId: "r", quantity: 2, unitCost: 3, remark: " " }
      ]
    };
    const inboundCreate = buildOtherInboundCreatePayload(
      inbound,
      "company",
      "user"
    );
    expect(inboundCreate.order).toMatchObject({
      desc: null,
      auditor: { connect: { uid: "user" } }
    });
    expect(inboundCreate.details).toEqual([
      { companyId: "company", repoId: "r", tireId: "t", count: 2, desc: null }
    ]);
    expect(
      buildOtherInboundUpdatePayload(inbound, "company", "user").details
    ).toEqual({ deleteMany: {}, createMany: { data: inboundCreate.details } });

    const outbound = {
      type: OtherOutboundType.WASTE,
      remark: "note",
      details: [
        { _uid: "row-1", tireId: "t", repoId: "r", quantity: 2, unitCost: 1 },
        { tireId: "t2", repoId: "r2", quantity: 1, unitCost: 1 }
      ]
    };
    const outboundCreate = buildOtherOutboundCreatePayload(
      outbound,
      "company",
      "user",
      "order-1"
    );
    expect(outboundCreate.order).toMatchObject({
      uid: "order-1",
      desc: "note"
    });
    expect(outboundCreate.details).toHaveLength(2);
    expect(outboundCreate.details[0].number).toBe("row-1");
    expect(outboundCreate.details[1].number).toMatch(/^[\w-]+$/);
    expect(
      buildOtherOutboundUpdatePayload(outbound, "company", "user", "order-1")
        .details.deleteMany
    ).toEqual({});
    expect(
      buildOtherOutboundUpdatePayload(outbound, "company", "user", "order-1")
        .details.createMany.data
    ).toHaveLength(2);
  });

  it("maps every inventory source into a document", () => {
    const transfer = mapTransferOrderToInventoryDocument({
      id: 0,
      uid: "transfer-1",
      docNo: "TR-1",
      fromRepositoryId: "a",
      toRepositoryId: "b",
      auditorId: "u",
      isApproved: true,
      isLocked: false,
      details: [
        { tireId: "t", count: 2 },
        { tireId: "t", count: 0 }
      ],
      operator: { uid: "u", name: "Op" },
      auditor: { uid: "a", name: "Aud" },
      createAt: "2026-05-01"
    });
    expect(transfer).toMatchObject({
      id: 0,
      orderNumber: "TR-1",
      type: DocumentType.TRANSFER,
      status: DocumentStatus.APPROVED,
      totalQuantity: 2,
      operatorName: "Op",
      auditorName: "Aud"
    });
    expect(
      mapTransferOrderToInventoryDocument({
        uid: "x",
        fromRepositoryId: "a",
        toRepositoryId: "b",
        auditorId: "u",
        isApproved: false,
        isLocked: false,
        rejectReason: "r",
        details: []
      }).status
    ).toBe(DocumentStatus.REJECTED);

    expect(
      mapInventoryCheckToInventoryDocument({
        id: 1,
        uid: "check-1",
        companyId: "c",
        repoId: "r",
        status: "COMPLETED",
        snapshotVersion: 1,
        ledgerCursorId: 0,
        startedAt: "2026-05-01",
        createdAt: "2026-05-02",
        createdBy: "u",
        creatorName: "Creator",
        remark: "ok",
        details: [{}, {}]
      } as never)
    ).toMatchObject({
      orderNumber: "check-1",
      status: DocumentStatus.COMPLETED,
      isApproved: true,
      totalQuantity: 2,
      operatorName: "Creator"
    });
    expect(
      mapInventoryCheckToInventoryDocument({
        id: 1,
        uid: "check-2",
        companyId: "c",
        repoId: "r",
        status: "CANCELLED",
        snapshotVersion: 1,
        ledgerCursorId: 0,
        createdAt: "2026-05-02",
        createdBy: "u"
      } as never).status
    ).toBe(DocumentStatus.CANCELLED);
    expect(
      mapInventoryCheckToInventoryDocument({
        id: 1,
        uid: "check-3",
        companyId: "c",
        repoId: "r",
        status: "IN_PROGRESS",
        snapshotVersion: 1,
        ledgerCursorId: 0,
        createdAt: "2026-05-02",
        createdBy: "u"
      } as never)
    ).toMatchObject({
      status: DocumentStatus.PENDING,
      isApproved: false,
      totalQuantity: 0
    });

    expect(
      mapAssemblyOrderToInventoryDocument(
        assembly({ details: [{ id: 1, tireId: "t", count: 2 }] }),
        DocumentType.ASSEMBLY
      )
    ).toMatchObject({
      type: DocumentType.ASSEMBLY,
      totalQuantity: 2,
      status: DocumentStatus.PENDING
    });
    expect(mapOtherInboundToInventoryDocument(inboundOrder())).toMatchObject({
      type: DocumentType.OTHER_INBOUND,
      status: "approved",
      totalAmount: 3,
      totalQuantity: 1
    });
    expect(mapOtherOutboundToInventoryDocument(outboundOrder())).toMatchObject({
      type: DocumentType.OTHER_OUTBOUND,
      status: "rejected",
      totalAmount: 4,
      totalQuantity: 2
    });

    expect(
      mapCostAdjustToInventoryDocument({
        id: 2,
        uid: "cost-1",
        number: 88n,
        isApproved: false,
        isLocked: false,
        totalAdjustAmount: 12n,
        createAt: "2026-05-03",
        details: [
          {
            repoId: "r",
            tireId: "t",
            originalCost: 1,
            adjustedCost: 2,
            count: 3
          }
        ],
        operator: { name: "Op" }
      })
    ).toMatchObject({
      orderNumber: "88",
      type: DocumentType.COST_ADJUST,
      status: DocumentStatus.PENDING,
      totalAmount: 12,
      totalQuantity: 3,
      operatorName: "Op"
    });
    expect(
      mapCostAdjustToInventoryDocument({
        id: 2,
        uid: "cost-2",
        number: 1n,
        isApproved: false,
        isLocked: false,
        totalAdjustAmount: 0n,
        createAt: "",
        details: [],
        rejectReason: "bad"
      }).status
    ).toBe(DocumentStatus.REJECTED);
  });

  it("filters documents by type, status, date and keyword, then sorts newest first", () => {
    const items = [
      {
        id: 1,
        uid: "a",
        orderNumber: "A-1",
        type: DocumentType.TRANSFER,
        status: DocumentStatus.PENDING,
        operatorName: "Alice",
        createdAt: "2026-01-01",
        remark: "first"
      },
      {
        id: 2,
        uid: "b",
        orderNumber: "B-2",
        type: DocumentType.COST_ADJUST,
        status: DocumentStatus.APPROVED,
        auditorName: "Bob",
        createdAt: "2026-02-01",
        remark: "second"
      },
      {
        id: 3,
        uid: "c",
        orderNumber: "C-3",
        type: DocumentType.TRANSFER,
        status: DocumentStatus.PENDING,
        createdAt: "invalid"
      }
    ];
    expect(filterInventoryDocuments(items).map(i => i.uid)).toEqual([
      "b",
      "a",
      "c"
    ]);
    expect(
      filterInventoryDocuments(items, { type: DocumentType.TRANSFER }).map(
        i => i.uid
      )
    ).toEqual(["a", "c"]);
    expect(
      filterInventoryDocuments(items, { status: DocumentStatus.APPROVED }).map(
        i => i.uid
      )
    ).toEqual(["b"]);
    expect(
      filterInventoryDocuments(items, { startDate: "2026-01-15" }).map(
        i => i.uid
      )
    ).toEqual(["b"]);
    expect(
      filterInventoryDocuments(items, { endDate: "2026-01-15" }).map(i => i.uid)
    ).toEqual(["a"]);
    expect(
      filterInventoryDocuments(items, {
        startDate: "2026-01-01",
        endDate: "2026-01-31"
      }).map(i => i.uid)
    ).toEqual(["a"]);
    expect(
      filterInventoryDocuments(items, { keyword: " bob " }).map(i => i.uid)
    ).toEqual(["b"]);
    expect(
      filterInventoryDocuments(items, { keyword: "first" }).map(i => i.uid)
    ).toEqual(["a"]);
    expect(filterInventoryDocuments(items, { keyword: "   " })).toHaveLength(3);
    expect(
      filterInventoryDocuments([items[2]], { startDate: "2026-01-01" })
    ).toEqual([]);
  });
});

function inboundOrder() {
  return {
    id: 1,
    uid: "in",
    orderNumber: "IN-1",
    type: OtherInboundType.OTHER_INBOUND,
    status: OtherInboundStatus.APPROVED,
    isApproved: true,
    isLocked: false,
    orderDate: "2026-01-01",
    totalAmount: 3,
    totalQuantity: 1,
    createdAt: "2026-01-01",
    remark: "in",
    details: [],
    operatorName: "Op",
    auditorName: "Aud"
  };
}

function outboundOrder() {
  return {
    id: 2,
    uid: "out",
    orderNumber: "OUT-1",
    type: OtherOutboundType.OTHER_OUTBOUND,
    status: OtherOutboundStatus.REJECTED,
    isApproved: false,
    isLocked: false,
    orderDate: "2026-01-02",
    totalAmount: 4,
    totalQuantity: 2,
    createdAt: "2026-01-02",
    remark: "out",
    details: [],
    operatorName: "Op",
    auditorName: "Aud"
  };
}
