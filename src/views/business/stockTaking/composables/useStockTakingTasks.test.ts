import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStockTakingTasks } from "./useStockTakingTasks";
import {
  completeInventoryCheckTaskApi,
  createInventoryCheckTaskApi,
  getInventoryCheckTaskApi,
  updateInventoryCheckDetailsApi,
  type InventoryCheckDetail,
  type InventoryCheckTask
} from "@/api/business/inventory-check";
import { message } from "@/utils/message";

const mocks = vi.hoisted(() => ({
  push: vi.fn()
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mocks.push
  })
}));

vi.mock("@/api/business/inventory-check", () => ({
  createInventoryCheckTaskApi: vi.fn(),
  getInventoryCheckTasksApi: vi.fn(),
  getInventoryCheckTaskApi: vi.fn(),
  updateInventoryCheckDetailsApi: vi.fn(),
  completeInventoryCheckTaskApi: vi.fn(),
  cancelInventoryCheckTaskApi: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

function createTask(
  overrides: Partial<InventoryCheckTask> = {}
): InventoryCheckTask {
  return {
    id: 1,
    uid: "task-1",
    companyId: "company-1",
    repoId: "repo-1",
    status: "IN_PROGRESS",
    startedAt: "2026-03-09T00:00:00.000Z",
    createdBy: "user-1",
    createdAt: "2026-03-09T00:00:00.000Z",
    details: [],
    ...overrides
  };
}

function createDetail(
  overrides: Partial<InventoryCheckDetail> = {}
): InventoryCheckDetail {
  return {
    id: 101,
    taskId: 1,
    tireId: "tire-1",
    bookCount: 10,
    ...overrides
  };
}

describe("useStockTakingTasks", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    vi.mocked(createInventoryCheckTaskApi).mockReset();
    vi.mocked(getInventoryCheckTaskApi).mockReset();
    vi.mocked(updateInventoryCheckDetailsApi).mockReset();
    vi.mocked(completeInventoryCheckTaskApi).mockReset();
    vi.mocked(message).mockReset();
  });

  it("creates a task and loads its details", async () => {
    const repoId = ref<string | undefined>("repo-1");
    vi.mocked(createInventoryCheckTaskApi).mockResolvedValue({
      code: 200,
      data: createTask({ id: 1, name: "盘点任务" })
    });
    vi.mocked(getInventoryCheckTaskApi).mockResolvedValue({
      code: 200,
      data: createTask({
        id: 1,
        name: "盘点任务",
        details: []
      })
    });

    const composable = useStockTakingTasks(repoId);
    composable.newTaskForm.value = { name: "盘点任务", remark: "备注" };

    await composable.handleCreateTask();

    expect(createInventoryCheckTaskApi).toHaveBeenCalledWith({
      repoId: "repo-1",
      name: "盘点任务",
      remark: "备注"
    });
    expect(getInventoryCheckTaskApi).toHaveBeenCalledWith(1);
    expect(composable.currentTask.value?.id).toBe(1);
    expect(message).toHaveBeenCalledWith("盘点任务创建成功", {
      type: "success"
    });
  });

  it("saves actual stock counts for entered details", async () => {
    const repoId = ref<string | undefined>("repo-1");
    vi.mocked(updateInventoryCheckDetailsApi).mockResolvedValue({
      code: 200,
      data: createTask({
        id: 9,
        details: [
          createDetail({
            id: 101,
            tireId: "tire-1",
            tireName: "轮胎A",
            bookCount: 10,
            actualCount: 12,
            remark: "盘盈2"
          })
        ]
      })
    });

    const composable = useStockTakingTasks(repoId);
    composable.currentTask.value = createTask({
      id: 9,
      details: [
        createDetail({
          id: 101,
          tireId: "tire-1",
          tireName: "轮胎A",
          bookCount: 10,
          actualCount: 12,
          remark: "盘盈2"
        }),
        createDetail({
          id: 102,
          taskId: 9,
          tireId: "tire-2",
          tireName: "轮胎B",
          bookCount: 5
        })
      ]
    });

    await composable.handleSaveDetails();

    expect(updateInventoryCheckDetailsApi).toHaveBeenCalledWith(9, {
      details: [
        {
          detailId: 101,
          actualCount: 12,
          remark: "盘盈2"
        }
      ]
    });
    expect(message).toHaveBeenCalledWith("保存成功", { type: "success" });
  });

  it("completes a task and reports generated surplus and waste orders", async () => {
    const repoId = ref<string | undefined>("repo-1");
    vi.mocked(completeInventoryCheckTaskApi).mockResolvedValue({
      code: 200,
      data: {
        task: createTask({
          id: 9,
          status: "COMPLETED",
          details: []
        }),
        surplusOrderId: "surplus-1",
        wasteOrderId: "waste-1"
      }
    });

    const composable = useStockTakingTasks(repoId);
    composable.currentTask.value = createTask({
      id: 9,
      details: []
    });

    await composable.handleCompleteTask();

    expect(completeInventoryCheckTaskApi).toHaveBeenCalledWith(9);
    expect(composable.currentTask.value).toMatchObject({ status: "COMPLETED" });
    expect(message).toHaveBeenCalledWith(
      "盘点完成！ 已生成盘盈单 已生成盘亏单",
      {
        type: "success"
      }
    );
  });
});
