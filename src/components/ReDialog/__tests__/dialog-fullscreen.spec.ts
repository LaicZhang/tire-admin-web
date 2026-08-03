import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";
import type { DialogOptions } from "../type";

vi.mock("@/utils/viewport", () => ({
  resolveDialogFullscreen: vi.fn(() => true)
}));

import { addDialog, closeAllDialog } from "../dialog-service";
import { resolveDialogFullscreen } from "@/utils/viewport";

describe("addDialog fullscreen defaults", () => {
  beforeEach(() => {
    closeAllDialog();
    vi.mocked(resolveDialogFullscreen).mockReturnValue(true);
  });

  afterEach(() => {
    closeAllDialog();
  });

  it("defaults fullscreen from resolveDialogFullscreen when omitted", () => {
    const store = ref<DialogOptions[]>([]);
    addDialog({ title: "t" }, store);
    expect(resolveDialogFullscreen).toHaveBeenCalled();
    expect(store.value[0].fullscreen).toBe(true);
    expect(store.value[0].visible).toBe(true);
  });

  it("respects explicit fullscreen false", () => {
    const store = ref<DialogOptions[]>([]);
    addDialog({ title: "t", fullscreen: false }, store);
    expect(store.value[0].fullscreen).toBe(false);
  });

  it("respects explicit fullscreen true", () => {
    vi.mocked(resolveDialogFullscreen).mockReturnValue(false);
    const store = ref<DialogOptions[]>([]);
    addDialog({ title: "t", fullscreen: true }, store);
    expect(store.value[0].fullscreen).toBe(true);
  });
});
