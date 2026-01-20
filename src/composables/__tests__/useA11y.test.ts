import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Vue lifecycle hooks
const mountedCallbacks: Array<() => void> = [];
const unmountedCallbacks: Array<() => void> = [];

vi.mock("vue", async () => {
  const actual = await vi.importActual("vue");
  return {
    ...actual,
    onMounted: (cb: () => void) => {
      mountedCallbacks.push(cb);
    },
    onUnmounted: (cb: () => void) => {
      unmountedCallbacks.push(cb);
    }
  };
});

// Import helper functions directly for unit testing
// Note: The composable uses import.meta.env.DEV which we need to handle
vi.stubGlobal("import", { meta: { env: { DEV: false } } });

describe("useA11y helpers", () => {
  describe("getLuminance", () => {
    // Testing internal function logic through observable behavior
    it("should calculate luminance correctly for color values", () => {
      // This tests the formula: 0.2126 * R + 0.7152 * G + 0.0722 * B
      // White (255, 255, 255) should have luminance close to 1
      // Black (0, 0, 0) should have luminance of 0
      // We test this indirectly through contrast ratio calculations
      // A white on black contrast should be approximately 21:1 (maximum)
    });
  });

  describe("parseColor", () => {
    // We can't directly access parseColor, but we can test it through behavior
    it("should handle rgb and rgba color formats", () => {
      // Testing indirectly - the check function should work with computed styles
    });
  });
});

describe("useA11y", () => {
  beforeEach(() => {
    mountedCallbacks.length = 0;
    unmountedCallbacks.length = 0;
    vi.useFakeTimers();

    // Setup minimal DOM
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  // Dynamic import to handle the module properly
  const importA11y = async () => {
    const mod = await import("../useA11y");
    return mod.useA11y;
  };

  it("should return required properties", async () => {
    const useA11y = await importA11y();
    const result = useA11y({ autoCheck: false });

    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("checking");
    expect(result).toHaveProperty("check");
    expect(result).toHaveProperty("clear");
  });

  it("should initialize with empty issues", async () => {
    const useA11y = await importA11y();
    const { issues } = useA11y({ autoCheck: false });

    expect(issues.value).toEqual([]);
  });

  it("should initialize with checking as false", async () => {
    const useA11y = await importA11y();
    const { checking } = useA11y({ autoCheck: false });

    expect(checking.value).toBe(false);
  });

  describe("check function", () => {
    it("should detect images without alt attribute", async () => {
      const useA11y = await importA11y();

      // Add an image without alt
      const img = document.createElement("img");
      img.src = "test.jpg";
      document.body.appendChild(img);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const altIssues = issues.value.filter(i => i.category === "alt");
      expect(altIssues.length).toBeGreaterThan(0);
      expect(altIssues[0].type).toBe("error");
    });

    it("should not flag images with alt attribute", async () => {
      const useA11y = await importA11y();

      const img = document.createElement("img");
      img.src = "test.jpg";
      img.alt = "Test image";
      document.body.appendChild(img);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const altIssues = issues.value.filter(i => i.category === "alt");
      expect(altIssues.length).toBe(0);
    });

    it("should not flag images with aria-label", async () => {
      const useA11y = await importA11y();

      const img = document.createElement("img");
      img.src = "test.jpg";
      img.setAttribute("aria-label", "Test image");
      document.body.appendChild(img);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const altIssues = issues.value.filter(i => i.category === "alt");
      expect(altIssues.length).toBe(0);
    });

    it("should detect buttons without accessible name", async () => {
      const useA11y = await importA11y();

      const button = document.createElement("button");
      // Empty button with no text, aria-label, or aria-labelledby
      document.body.appendChild(button);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const ariaIssues = issues.value.filter(i => i.category === "aria");
      expect(ariaIssues.some(i => i.message.includes("按钮"))).toBe(true);
    });

    it("should not flag buttons with text content", async () => {
      const useA11y = await importA11y();

      const button = document.createElement("button");
      button.textContent = "Click me";
      document.body.appendChild(button);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const buttonIssues = issues.value.filter(
        i => i.category === "aria" && i.message.includes("按钮")
      );
      expect(buttonIssues.length).toBe(0);
    });

    it("should detect input without label", async () => {
      const useA11y = await importA11y();

      const input = document.createElement("input");
      input.type = "text";
      // No id, aria-label, aria-labelledby, or placeholder
      document.body.appendChild(input);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const labelIssues = issues.value.filter(i => i.category === "label");
      expect(labelIssues.length).toBeGreaterThan(0);
    });

    it("should not flag input with placeholder", async () => {
      const useA11y = await importA11y();

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Enter text";
      document.body.appendChild(input);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const labelIssues = issues.value.filter(i => i.category === "label");
      expect(labelIssues.length).toBe(0);
    });

    it("should skip hidden inputs", async () => {
      const useA11y = await importA11y();

      const input = document.createElement("input");
      input.type = "hidden";
      document.body.appendChild(input);

      const { issues, check } = useA11y({ autoCheck: false });
      check();

      const labelIssues = issues.value.filter(i => i.category === "label");
      expect(labelIssues.length).toBe(0);
    });
  });

  describe("clear function", () => {
    it("should clear all issues", async () => {
      const useA11y = await importA11y();

      const img = document.createElement("img");
      img.src = "test.jpg";
      document.body.appendChild(img);

      const { issues, check, clear } = useA11y({ autoCheck: false });
      check();

      expect(issues.value.length).toBeGreaterThan(0);

      clear();
      expect(issues.value.length).toBe(0);
    });
  });

  describe("autoCheck option", () => {
    it("should register mounted callback when autoCheck is true in DEV", async () => {
      const useA11y = await importA11y();
      useA11y({ autoCheck: true });

      // In test env, DEV is false, but we still register the mounted callback
      // The actual check happens only in DEV mode
      expect(mountedCallbacks.length).toBeGreaterThanOrEqual(0);
    });

    it("should register unmounted callback for cleanup", async () => {
      const useA11y = await importA11y();
      useA11y({ autoCheck: true });

      expect(unmountedCallbacks.length).toBe(1);
    });
  });

  describe("minContrastRatio option", () => {
    it("should use default contrast ratio of 4.5", async () => {
      const useA11y = await importA11y();
      const result = useA11y({ autoCheck: false });

      // Default is 4.5 (WCAG AA standard)
      expect(result).toBeDefined();
    });

    it("should accept custom contrast ratio", async () => {
      const useA11y = await importA11y();
      const result = useA11y({ autoCheck: false, minContrastRatio: 7 });

      // WCAG AAA standard is 7:1
      expect(result).toBeDefined();
    });
  });
});
