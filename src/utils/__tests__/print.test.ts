import Print from "../print";

type PrintCtor = new (
  dom: string | Element | { $el: Element },
  options?: Record<string, unknown>
) => {
  conf: Record<string, unknown>;
  dom: Element | null;
  getStyle: () => string;
  getHtml: () => string;
  writeIframe: (content: string) => void;
  toPrint: (target: Document | Window) => void;
  extendOptions: <T>(target: Record<string, unknown>, source: T) => T;
  setDomHeight: (selectors: string[]) => void;
};

const PrintClass = Print as unknown as PrintCtor;

function makePrint(
  dom: string | Element | { $el: Element },
  options?: Record<string, unknown>
) {
  return new PrintClass(dom, options);
}

describe("Print", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("works without new and handles a missing selector", () => {
    const instance = (
      Print as unknown as (dom: string) => { dom: Element | null }
    )("#missing");
    expect(instance.dom).toBeNull();
    expect(document.querySelector("#myIframe")).not.toBeNull();
  });

  it("accepts elements and component-like objects and applies safe options", () => {
    const target = document.createElement("section");
    target.id = "target";
    target.textContent = "printable";
    document.body.appendChild(target);
    const sized = document.createElement("div");
    sized.id = "sized";
    sized.style.height = "10px";
    Object.defineProperty(sized, "offsetHeight", { value: 42 });
    document.body.appendChild(sized);

    const fromElement = makePrint(target, { styleStr: ".custom{color:red}" });
    expect(fromElement.dom).toBe(target);
    expect(fromElement.getStyle()).toContain(".custom{color:red}");

    const fromComponent = makePrint({ $el: target });
    expect(fromComponent.dom).toBe(target);

    const resized = makePrint(target, { setDomHeightArr: ["#sized"] });
    expect(sized.style.height).toBe("42px");
    expect(resized.dom).toBe(target);
  });

  it("serializes current form state into the print clone", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <input id="text" value="old" />
      <input id="checked" type="checkbox" checked />
      <input id="unchecked" type="radio" />
      <textarea>old text</textarea>
      <select><option>one</option><option>two</option></select>
      <canvas></canvas>
    `;
    const text = root.querySelector<HTMLInputElement>("#text")!;
    const checked = root.querySelector<HTMLInputElement>("#checked")!;
    const unchecked = root.querySelector<HTMLInputElement>("#unchecked")!;
    const textarea = root.querySelector("textarea")!;
    const select = root.querySelector("select")!;
    const canvas = root.querySelector("canvas")!;
    text.value = "current";
    checked.checked = true;
    unchecked.checked = false;
    textarea.value = "current text";
    select.options[1].selected = true;
    canvas.toDataURL = vi.fn(() => "data:image/png;base64,abc");

    const html = makePrint(root).getHtml();

    expect(html).toContain('value="current"');
    expect(html).toContain('checked="checked"');
    expect(html).toContain("current text");
    expect(html).toContain('<option selected="selected">two</option>');
    expect(html).toContain('src="data:image/png;base64,abc"');
  });

  it("keeps a canvas when serialization fails", () => {
    const root = document.createElement("div");
    const canvas = document.createElement("canvas");
    canvas.toDataURL = vi.fn(() => {
      throw new Error("tainted");
    });
    root.appendChild(canvas);

    expect(makePrint(root).getHtml()).toContain("<canvas");
  });

  it("removes the iframe when loading fails or has no document", () => {
    const instance = makePrint(document.createElement("div"));
    const iframe = document.querySelector<HTMLIFrameElement>("#myIframe")!;
    iframe.onerror?.(new Event("error") as never);
    expect(document.querySelector("#myIframe")).toBeNull();

    instance.writeIframe("next");
    const second = document.querySelector<HTMLIFrameElement>("#myIframe")!;
    vi.spyOn(second, "contentDocument", "get").mockReturnValue(null);
    vi.spyOn(second, "contentWindow", "get").mockReturnValue(null);
    second.onload?.(new Event("load") as never);
    expect(document.querySelector("#myIframe")).toBeNull();
  });

  it("runs callbacks and removes the iframe after printing", () => {
    const before = vi.fn();
    const after = vi.fn();
    makePrint(document.createElement("div"), {
      printBeforeFn: before,
      printDoneCallBack: after
    });
    const iframe = document.querySelector<HTMLIFrameElement>("#myIframe")!;
    const target = {
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
      document: { execCommand: vi.fn(() => true) }
    };
    vi.spyOn(iframe, "contentWindow", "get").mockReturnValue(
      target as unknown as Window
    );
    vi.spyOn(iframe, "contentDocument", "get").mockReturnValue(
      target.document as unknown as Document
    );

    iframe.onload?.(new Event("load") as never);
    expect(before).toHaveBeenCalledWith({ doc: target.document });

    vi.advanceTimersByTime(120);
    expect(target.focus).toHaveBeenCalled();
    expect(target.print).toHaveBeenCalled();
    expect(target.close).toHaveBeenCalled();
    expect(after).toHaveBeenCalled();
    expect(document.querySelector("#myIframe")).toBeNull();
  });

  it("prints when execCommand reports false or throws", () => {
    const instance = makePrint(document.createElement("div"));

    const fallback = {
      document: { execCommand: vi.fn(() => false) },
      print: vi.fn(),
      close: vi.fn()
    };
    instance.toPrint(fallback as unknown as Document);
    vi.advanceTimersByTime(20);
    expect(fallback.print).toHaveBeenCalled();

    const throwing = {
      document: {
        execCommand: vi.fn(() => {
          throw new Error("unsupported");
        })
      },
      print: vi.fn()
    };
    instance.toPrint(throwing as unknown as Document);
    vi.advanceTimersByTime(20);
    expect(throwing.print).toHaveBeenCalled();

    const printOnly = { print: vi.fn() };
    instance.toPrint(printOnly as unknown as Window);
    vi.advanceTimersByTime(20);
    expect(printOnly.print).toHaveBeenCalled();
  });

  it("swallows failures raised while accessing the print target", () => {
    const instance = makePrint(document.createElement("div"));
    const target = Object.defineProperty({}, "focus", {
      get() {
        throw new Error("closed");
      }
    });
    expect(() => instance.toPrint(target as Window)).not.toThrow();
    expect(() => vi.advanceTimersByTime(20)).toThrow("closed");
  });

  it("extends options and tolerates empty height selectors", () => {
    const instance = makePrint(document.createElement("div"));
    const target: Record<string, unknown> = { a: 1 };
    expect(instance.extendOptions(target, { b: 2 })).toEqual({ a: 1, b: 2 });
    expect(() => instance.setDomHeight([])).not.toThrow();
  });
});
