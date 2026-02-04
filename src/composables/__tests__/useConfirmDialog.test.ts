import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils", () => ({
  confirmBox: vi.fn()
}));

import { confirmBox } from "@/utils";
import { useConfirmDialog } from "../useConfirmDialog";

describe("useConfirmDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirm returns true when confirmBox resolves", async () => {
    vi.mocked(confirmBox).mockResolvedValueOnce(undefined as unknown as never);

    const { confirm } = useConfirmDialog();
    await expect(
      confirm("content", "title", { type: "warning" })
    ).resolves.toBe(true);

    expect(confirmBox).toHaveBeenCalledWith("content", "title", {
      type: "warning"
    });
  });

  it("confirm returns false when cancelled", async () => {
    vi.mocked(confirmBox).mockRejectedValueOnce("cancel");

    const { confirm } = useConfirmDialog();
    await expect(confirm("content")).resolves.toBe(false);
  });

  it("confirm returns false when closed", async () => {
    vi.mocked(confirmBox).mockRejectedValueOnce({ message: "close" });

    const { confirm } = useConfirmDialog();
    await expect(confirm("content")).resolves.toBe(false);
  });

  it("confirm rethrows non-cancel errors", async () => {
    vi.mocked(confirmBox).mockRejectedValueOnce(new Error("boom"));

    const { confirm } = useConfirmDialog();
    await expect(confirm("content")).rejects.toThrow("boom");
  });

  it("handleConfirmAction returns false and skips callback on cancel", async () => {
    vi.mocked(confirmBox).mockRejectedValueOnce("cancel");
    const onConfirm = vi.fn();

    const { handleConfirmAction } = useConfirmDialog();
    await expect(
      handleConfirmAction("content", onConfirm, { title: "title" })
    ).resolves.toBe(false);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("handleConfirmAction calls callback when confirmed", async () => {
    vi.mocked(confirmBox).mockResolvedValueOnce(undefined as unknown as never);
    const onConfirm = vi.fn();

    const { handleConfirmAction } = useConfirmDialog();
    await expect(
      handleConfirmAction("content", onConfirm, { title: "title" })
    ).resolves.toBe(true);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
