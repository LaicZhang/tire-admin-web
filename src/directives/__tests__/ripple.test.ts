import { Ripple, type RippleDirectiveBinding } from "../ripple";

type RippleElement = HTMLElement & {
  _ripple?: {
    enabled?: boolean;
    centered?: boolean;
    circle?: boolean;
    class?: string;
    touched?: boolean;
  };
};
const directive = Ripple as unknown as {
  mounted: (el: HTMLElement, binding: RippleDirectiveBinding) => void;
  updated: (el: HTMLElement, binding: RippleDirectiveBinding) => void;
  unmounted: (el: HTMLElement) => void;
};

function binding(
  value: RippleDirectiveBinding["value"],
  oldValue: RippleDirectiveBinding["value"] = value,
  modifiers: RippleDirectiveBinding["modifiers"] = {}
) {
  return {
    value,
    oldValue,
    modifiers,
    arg: undefined,
    instance: null,
    dir: {} as RippleDirectiveBinding["dir"]
  } as RippleDirectiveBinding;
}

function pointer(type: string, x = 10, y = 10) {
  return new PointerEvent(type, { clientX: x, clientY: y, bubbles: true });
}

function setupElement() {
  const el = document.createElement("button") as RippleElement;
  el.style.position = "static";
  Object.defineProperty(el, "clientWidth", { value: 100 });
  Object.defineProperty(el, "clientHeight", { value: 40 });
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left: 2,
    top: 3,
    width: 100,
    height: 40,
    right: 102,
    bottom: 43,
    x: 2,
    y: 3,
    toJSON: () => ({})
  });
  document.body.appendChild(el);
  return el;
}

describe("v-ripple", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("shows and hides a ripple for pointer interactions", () => {
    const el = setupElement();
    directive.mounted(el, binding(undefined, undefined, { circle: true }));

    el.dispatchEvent(pointer("pointerdown", 90, 2));
    const animation = el.querySelector<HTMLElement>(".v-ripple__animation");
    expect(animation).not.toBeNull();
    expect(animation?.style.width).not.toBe("0px");
    expect(el.style.position).toBe("relative");

    el.dispatchEvent(pointer("pointerup"));
    vi.advanceTimersByTime(600);
    expect(el.querySelector(".v-ripple__animation")).toBeNull();
    expect(el.style.position).toBe("static");
  });

  it("supports centered circle ripples and custom classes", () => {
    const el = setupElement();
    directive.mounted(
      el,
      binding({ class: "custom-ripple" }, undefined, {
        center: true,
        circle: true
      })
    );

    el.dispatchEvent(pointer("pointerdown", 30, 20));
    expect(
      el.querySelector(".v-ripple__container.custom-ripple")
    ).not.toBeNull();
    expect(
      el.querySelector<HTMLElement>(".v-ripple__animation")?.style.transform
    ).toContain("translate(0px, -30px)");
  });

  it("ignores repeated pointerdown while touched and survives missing ripples", () => {
    const el = setupElement();
    directive.mounted(el, binding(undefined));
    el.dispatchEvent(pointer("pointerdown"));
    el.dispatchEvent(pointer("pointerdown"));
    expect(el.querySelectorAll(".v-ripple__animation")).toHaveLength(2);

    el.removeChild(el.querySelector(".v-ripple__container")!);
    expect(() => el.dispatchEvent(pointer("pointerup"))).not.toThrow();
  });

  it("does not show when disabled and removes active ripples", () => {
    const el = setupElement();
    directive.mounted(el, binding(false));
    el.dispatchEvent(pointer("pointerdown"));
    expect(el.querySelector(".v-ripple__container")).toBeNull();

    directive.updated(el, binding(true, false));
    el.dispatchEvent(pointer("pointerdown"));
    expect(el.querySelector(".v-ripple__container")).not.toBeNull();

    directive.updated(el, binding(false, true));
    expect(el._ripple?.enabled).toBe(false);
    el.dispatchEvent(pointer("pointerdown"));
    expect(el.querySelectorAll(".v-ripple__container")).toHaveLength(1);
  });

  it("updates only when the bound value changes", () => {
    const el = setupElement();
    directive.mounted(el, binding(true));
    directive.updated(el, binding(true, true));
    expect(el._ripple).toEqual({
      enabled: true,
      centered: undefined,
      circle: undefined,
      class: undefined
    });

    directive.updated(
      el,
      binding({ class: "updated" }, true, { center: true })
    );
    expect(el._ripple?.class).toBe("updated");
    expect(el._ripple?.centered).toBe(true);
  });

  it("cleans up directive state when unmounted", () => {
    const el = setupElement();
    directive.mounted(el, binding(undefined));
    directive.unmounted(el);
    expect(el._ripple).toBeUndefined();
    el.dispatchEvent(pointer("pointerdown"));
    expect(el.querySelector(".v-ripple__container")).toBeNull();
  });

  it("handles hide calls for each guard path", () => {
    const disabled = setupElement();
    directive.mounted(disabled, binding(false));
    expect(() => disabled.dispatchEvent(pointer("pointerup"))).not.toThrow();

    const enabled = setupElement();
    directive.mounted(enabled, binding(true));
    enabled.dispatchEvent(pointer("pointerdown"));
    enabled.dispatchEvent(pointer("pointerup"));
    enabled.dispatchEvent(pointer("pointerup"));
    expect(enabled.querySelectorAll(".v-ripple__animation")).toHaveLength(1);
  });
});
