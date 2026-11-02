import type { DirectiveBinding } from "vue";

const { hasAuthMock, copyMock, messageMock, warnMock } = vi.hoisted(() => ({
  hasAuthMock: vi.fn(),
  copyMock: vi.fn(),
  messageMock: vi.fn(),
  warnMock: vi.fn()
}));

vi.mock("@/router/utils", () => ({ hasAuth: hasAuthMock }));
vi.mock("@/utils/message", () => ({ message: messageMock }));
vi.mock("@/utils/logger", () => ({
  createLogger: () => ({ warn: warnMock, error: vi.fn(), info: vi.fn() })
}));
vi.mock("@pureadmin/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@pureadmin/utils")>();
  return { ...actual, copyTextToClipboard: copyMock };
});

import { auth } from "../auth";
import { copy } from "../copy";
import { longpress } from "../longpress";
import { optimize } from "../optimize";
import { Ripple } from "../ripple";

type Hook = (el: HTMLElement, binding: DirectiveBinding) => void;

function binding(value: unknown, arg?: string, oldValue?: unknown) {
  return { value, oldValue, arg, modifiers: {} } as DirectiveBinding;
}

function mountElement() {
  const parent = document.createElement("div");
  const el = document.createElement("button");
  parent.appendChild(el);
  document.body.appendChild(parent);
  return { parent, el };
}

describe("auth directive", () => {
  beforeEach(() => {
    hasAuthMock.mockReset();
    warnMock.mockReset();
    document.body.innerHTML = "";
  });

  it("removes unauthorized elements and restores display-mode elements", () => {
    hasAuthMock.mockReturnValue(false);
    const first = mountElement();
    (auth.mounted as Hook)(first.el, binding(["btn.add"]));
    expect(first.el.parentNode).toBeNull();

    const second = mountElement();
    (auth.mounted as Hook)(second.el, binding(["btn.add"], "display"));
    expect(second.el.style.display).toBe("none");

    hasAuthMock.mockReturnValue(true);
    (auth.updated as Hook)(second.el, binding(["btn.add"], "display"));
    expect(second.el.style.display).toBe("");
  });

  it("accepts authorized elements and warns when no value is supplied", () => {
    hasAuthMock.mockReturnValue(true);
    const { el, parent } = mountElement();
    (auth.mounted as Hook)(el, binding("btn.add"));
    expect(parent.contains(el)).toBe(true);

    (auth.mounted as Hook)(el, binding(undefined));
    expect(warnMock).toHaveBeenCalledWith(
      "need auths! Like v-auth=\"['btn.add','btn.edit']\""
    );
    (auth.updated as Hook)(el, binding("ignored"));
  });
});

describe("copy directive", () => {
  beforeEach(() => {
    copyMock.mockReset();
    messageMock.mockReset();
    warnMock.mockReset();
    document.body.innerHTML = "";
  });

  it("copies the latest value on the configured event", () => {
    copyMock.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const { el } = mountElement();
    type CopyEl = HTMLElement & { copyValue: string };
    (copy.mounted as Hook)(el, binding("first"));
    el.dispatchEvent(new MouseEvent("dblclick"));
    expect(copyMock).toHaveBeenCalledWith("first");
    expect(messageMock).toHaveBeenCalledWith("复制成功", { type: "success" });

    (copy.updated as Hook)(el as CopyEl, binding("second"));
    el.dispatchEvent(new MouseEvent("dblclick"));
    expect(copyMock).toHaveBeenLastCalledWith("second");
    expect(messageMock).toHaveBeenCalledWith("复制失败", { type: "error" });
  });

  it("supports a custom event and warns for empty values", () => {
    copyMock.mockReturnValue(true);
    const { el } = mountElement();
    (copy.mounted as Hook)(el, binding("fixture", "click"));
    el.click();
    expect(copyMock).toHaveBeenCalledWith("fixture");

    (copy.mounted as Hook)(el, binding(""));
    expect(warnMock).toHaveBeenCalledWith(
      'need value! Like v-copy="modelValue"'
    );
  });
});

describe("longpress directive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });
  afterEach(() => vi.useRealTimers());

  it("fires once after a delay and repeatedly for interval syntax", () => {
    const cb = vi.fn();
    const { el } = mountElement();
    (longpress.mounted as Hook)(el, binding(cb, "100:20"));

    el.dispatchEvent(new PointerEvent("pointerdown"));
    vi.advanceTimersByTime(99);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(40);
    expect(cb).toHaveBeenCalledTimes(3);
    el.dispatchEvent(new PointerEvent("pointerup"));
    vi.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("supports a numeric delay and validates callbacks", () => {
    const cb = vi.fn();
    const { el } = mountElement();
    (longpress.mounted as Hook)(el, binding(cb, "50"));
    el.dispatchEvent(new PointerEvent("pointerdown"));
    vi.advanceTimersByTime(50);
    expect(cb).toHaveBeenCalledOnce();
    el.dispatchEvent(new PointerEvent("pointerleave"));

    expect(() => (longpress.mounted as Hook)(el, binding("not-fn"))).toThrow(
      "need callback and callback must be a function"
    );
  });
});

describe("optimize directive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });
  afterEach(() => vi.useRealTimers());

  it("debounces with params and supports immediate invocation", () => {
    const fn = vi.fn();
    const { el } = mountElement();
    (optimize.mounted as Hook)(
      el,
      binding(
        { event: "input", fn, params: { id: 1 }, timeout: 20 },
        "debounce"
      )
    );
    el.dispatchEvent(new Event("input"));
    el.dispatchEvent(new Event("input"));
    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith({ id: 1 });

    const immediate = vi.fn();
    const second = mountElement();
    (optimize.mounted as Hook)(
      second.el,
      binding({ event: "click", fn: immediate, immediate: true }, "debounce")
    );
    second.el.click();
    expect(immediate).toHaveBeenCalledOnce();
  });

  it("throttles and rejects invalid configuration", () => {
    const fn = vi.fn();
    const { el } = mountElement();
    (optimize.mounted as Hook)(
      el,
      binding({ event: "click", fn, params: [1, 2], timeout: 50 }, "throttle")
    );
    el.click();
    el.click();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(1, 2);

    expect(() =>
      (optimize.mounted as Hook)(el, binding({}, "unknown"))
    ).toThrow("only `debounce` and `throttle` are supported");
    expect(() =>
      (optimize.mounted as Hook)(el, binding({ event: "click" }))
    ).toThrow("`event` and `fn` are required");
    expect(() =>
      (optimize.mounted as Hook)(
        el,
        binding({ event: "click", fn, params: "bad" })
      )
    ).toThrow("`params` must be an array or object");
  });
});

describe("ripple directive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });
  afterEach(() => vi.useRealTimers());

  it("renders and removes a centered circular ripple", () => {
    const { el } = mountElement();
    Object.defineProperty(el, "clientWidth", {
      value: 100,
      configurable: true
    });
    Object.defineProperty(el, "clientHeight", {
      value: 40,
      configurable: true
    });
    (Ripple.mounted as Hook)(el, {
      value: { class: "custom-ripple" },
      oldValue: true,
      modifiers: { center: true, circle: true }
    } as DirectiveBinding);
    el.dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 10, clientY: 10 })
    );
    expect(
      el.querySelector(".v-ripple__container.custom-ripple")
    ).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(el.querySelector(".v-ripple__animation--in")).not.toBeNull();
    el.dispatchEvent(new PointerEvent("pointerup"));
    vi.advanceTimersByTime(600);
    expect(el.querySelector(".v-ripple__container")).toBeNull();

    (Ripple.updated as Hook)(el, {
      value: false,
      oldValue: true,
      modifiers: {}
    } as DirectiveBinding);
    (Ripple.unmounted as Hook)(el, {} as DirectiveBinding);
    expect(el._ripple).toBeUndefined();
  });

  it("covers disabled, duplicate-hide and non-circular branches", () => {
    const { el } = mountElement();
    (Ripple.mounted as Hook)(el, {
      value: true,
      oldValue: true,
      modifiers: {}
    } as DirectiveBinding);
    (Ripple.updated as Hook)(el, {
      value: false,
      oldValue: true,
      modifiers: {}
    } as DirectiveBinding);
    el.dispatchEvent(new PointerEvent("pointerdown"));

    (Ripple.updated as Hook)(el, {
      value: true,
      oldValue: false,
      modifiers: {}
    } as DirectiveBinding);
    el.dispatchEvent(new PointerEvent("pointerdown"));
    const animation = el.querySelector<HTMLElement>(".v-ripple__animation")!;
    animation.dataset.activated = String(performance.now() - 1000);
    (Ripple.updated as Hook)(el, {
      value: true,
      oldValue: true,
      modifiers: {}
    } as DirectiveBinding);
    el.dispatchEvent(new PointerEvent("pointerup"));
    el.dispatchEvent(new PointerEvent("pointerup"));
    expect(animation.dataset.isHiding).toBe("true");
    vi.advanceTimersByTime(600);
  });
});
