// PrintFunction interface is used for documentation purposes
interface _PrintFunction {
  extendOptions: Function;
  getStyle: Function;
  setDomHeight: Function;
  toPrint: Function;
}

interface PrintInstance {
  conf: {
    styleStr: string;
    setDomHeightArr: string[];
    printBeforeFn: ((params: { doc: Document }) => void) | null;
    printDoneCallBack: (() => void) | null;
  };
  dom: Element | null;
  init: () => void;
  getStyle: () => string;
  getHtml: () => string;
  writeIframe: (content: string) => void;
  toPrint: (frameWindow: Document | Window) => void;

  isDOM: (obj: unknown) => boolean;
  setDomHeight: (arr: string[]) => void;

  extendOptions: <T>(obj: unknown, obj2: T) => T;
}

const Print = function (
  this: PrintInstance,
  // Vue component instance or DOM element - requires any for $el access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dom: string | Element | any,
  options?: Partial<PrintInstance["conf"]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  options = options || {};
  // @ts-expect-error Check if called with new operator
  if (!(this instanceof Print)) return new Print(dom, options);
  this.conf = {
    styleStr: "",
    // Elements that need to dynamically get and set the height
    setDomHeightArr: [],
    // Callback before printing
    printBeforeFn: null,
    // Callback after printing
    printDoneCallBack: null
  };

  const conf = this.conf as Record<string, unknown>;
  for (const key in conf) {
    if (key && Object.prototype.hasOwnProperty.call(options, key)) {
      conf[key] = (options as Record<string, unknown>)[key];
    }
  }
  if (typeof dom === "string") {
    this.dom = document.querySelector(dom);
  } else {
    this.dom = this.isDOM(dom) ? dom : dom.$el;
  }
  if (this.conf.setDomHeightArr && this.conf.setDomHeightArr.length) {
    this.setDomHeight(this.conf.setDomHeightArr);
  }
  this.init();
  return this;
};

Print.prototype = {
  /**
   * init
   */
  init: function (this: PrintInstance): void {
    const content = this.getStyle() + (this.getHtml() || "");
    this.writeIframe(content);
  },
  /**
   * Configuration property extension
   * @param {Object} obj
   * @param {Object} obj2
   */

  extendOptions: function <T extends Record<string, unknown>>(
    this: PrintInstance,
    obj: Record<string, unknown>,
    obj2: T
  ): T {
    for (const k in obj2) {
      obj[k] = obj2[k] as unknown;
    }
    return obj as T;
  },
  /**
    Copy all styles of the original page
  */
  getStyle: function (this: PrintInstance): string {
    let str = "";
    const styles: NodeListOf<Element> = document.querySelectorAll("style,link");
    for (let i = 0; i < styles.length; i++) {
      str += styles[i].outerHTML;
    }
    str += `<style>.no-print{display:none;}${this.conf.styleStr}</style>`;
    return str;
  },
  // form assignment
  getHtml: function (this: PrintInstance): string {
    const root = this.dom as HTMLElement | null;
    if (!root) return "";

    const clone = root.cloneNode(true) as HTMLElement;

    // 同步 input 值/勾选状态
    const originInputs = root.querySelectorAll<HTMLInputElement>("input");
    const cloneInputs = clone.querySelectorAll<HTMLInputElement>("input");
    originInputs.forEach((input, index) => {
      const target = cloneInputs[index];
      if (!target) return;

      if (input.type === "checkbox" || input.type === "radio") {
        if (input.checked) target.setAttribute("checked", "checked");
        else target.removeAttribute("checked");
        return;
      }

      target.setAttribute("value", input.value);
    });

    // 同步 textarea 值
    const originTextareas =
      root.querySelectorAll<HTMLTextAreaElement>("textarea");
    const cloneTextareas =
      clone.querySelectorAll<HTMLTextAreaElement>("textarea");
    originTextareas.forEach((textarea, index) => {
      const target = cloneTextareas[index];
      if (!target) return;
      target.textContent = textarea.value;
    });

    // 同步 select 选中项
    const originSelects = root.querySelectorAll<HTMLSelectElement>("select");
    const cloneSelects = clone.querySelectorAll<HTMLSelectElement>("select");
    originSelects.forEach((select, index) => {
      const target = cloneSelects[index];
      if (!target) return;
      for (let i = 0; i < target.options.length; i++) {
        const option = target.options[i];
        const isSelected = select.options[i]?.selected ?? false;
        if (isSelected) option.setAttribute("selected", "selected");
        else option.removeAttribute("selected");
      }
    });

    // canvas 转图片（避免打印空白）
    const originCanvases = root.querySelectorAll<HTMLCanvasElement>("canvas");
    const cloneCanvases = clone.querySelectorAll<HTMLCanvasElement>("canvas");
    originCanvases.forEach((canvas, index) => {
      const target = cloneCanvases[index];
      if (!target) return;
      try {
        const imageURL = canvas.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = imageURL;
        img.style.maxWidth = "100%";
        target.parentNode?.replaceChild(img, target);
      } catch {
        // ignore
      }
    });

    return clone.outerHTML;
  },
  /**
    create iframe
  */
  writeIframe: function (this: PrintInstance, content: string) {
    const iframe: HTMLIFrameElement = document.createElement("iframe");
    iframe.id = "myIframe";
    iframe.setAttribute(
      "style",
      "position:absolute;width:0;height:0;top:-10px;left:-10px;"
    );

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    iframe.onload = function (): void {
      const w = iframe.contentWindow;
      const doc = iframe.contentDocument ?? w?.document;
      if (!doc || !w) return;
      // Before popping, callback
      if (_this.conf.printBeforeFn) {
        _this.conf.printBeforeFn({ doc });
      }
      _this.toPrint(w);
      setTimeout(function () {
        document.body.removeChild(iframe);
        // After popup, callback
        if (_this.conf.printDoneCallBack) {
          _this.conf.printDoneCallBack();
        }
      }, 100);
    };

    const f: HTMLIFrameElement = document.body.appendChild(iframe);
    f.srcdoc = content;
  },
  /**
    Print
  */
  toPrint: function (
    this: PrintInstance,
    frameWindow: Document | Window
  ): void {
    try {
      setTimeout(function () {
        const win = frameWindow as Window;
        if (win.focus) {
          win.focus();
        }
        try {
          if (win.document && !win.document.execCommand("print", false)) {
            win.print();
          } else if (win.print) {
            win.print();
          }
        } catch {
          if (win.print) {
            win.print();
          }
        }
        if (win.close) {
          win.close();
        }
      }, 10);
    } catch (err) {
      // Print errors are non-critical, only log in development
      if (import.meta.env.DEV) {
        console.error("[Print] Error:", err);
      }
    }
  },
  isDOM:
    typeof HTMLElement === "object"
      ? function (obj: unknown) {
          return obj instanceof HTMLElement;
        }
      : function (obj: unknown) {
          return (
            obj &&
            typeof obj === "object" &&
            (obj as Node).nodeType === 1 &&
            typeof (obj as Node).nodeName === "string"
          );
        },
  /**
   * Set the height of the specified dom element by getting the existing height of the dom element and setting
   * @param {Array} arr
   */
  setDomHeight(this: PrintInstance, arr: string[]) {
    if (arr && arr.length) {
      arr.forEach(name => {
        const domArr = document.querySelectorAll(name);
        domArr.forEach(dom => {
          const element = dom as HTMLElement;
          if (element.style && element.offsetHeight !== undefined) {
            element.style.height = element.offsetHeight + "px";
          }
        });
      });
    }
  }
};

export default Print;
