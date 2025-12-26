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
  getHtml: () => Element;
  writeIframe: (content: string) => void;
  toPrint: (frameWindow: Document | Window) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDOM: (obj: any) => boolean;
  setDomHeight: (arr: string[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extendOptions: <T>(obj: any, obj2: T) => T;
}

const Print = function (
  this: PrintInstance,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conf = this.conf as Record<string, any>;
  for (const key in conf) {
    if (key && Object.prototype.hasOwnProperty.call(options, key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conf[key] = (options as any)[key];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extendOptions: function <T>(this: PrintInstance, obj: any, obj2: T): T {
    for (const k in obj2) {
      obj[k] = obj2[k];
    }
    return obj;
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
    const inputs = document.querySelectorAll("input");
    const selects = document.querySelectorAll("select");
    const textareas = document.querySelectorAll("textarea");
    const canvass = document.querySelectorAll("canvas");

    for (let k = 0; k < inputs.length; k++) {
      if (inputs[k].type == "checkbox" || inputs[k].type == "radio") {
        if (inputs[k].checked == true) {
          inputs[k].setAttribute("checked", "checked");
        } else {
          inputs[k].removeAttribute("checked");
        }
      } else if (inputs[k].type == "text") {
        inputs[k].setAttribute("value", inputs[k].value);
      } else {
        inputs[k].setAttribute("value", inputs[k].value);
      }
    }

    for (let k2 = 0; k2 < textareas.length; k2++) {
      if (textareas[k2].type == "textarea") {
        textareas[k2].innerHTML = textareas[k2].value;
      }
    }

    for (let k3 = 0; k3 < selects.length; k3++) {
      if (selects[k3].type == "select-one") {
        const child = selects[k3].children;
        for (const i in child) {
          if (child[i].tagName == "OPTION") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((child[i] as any).selected == true) {
              child[i].setAttribute("selected", "selected");
            } else {
              child[i].removeAttribute("selected");
            }
          }
        }
      }
    }

    for (let k4 = 0; k4 < canvass.length; k4++) {
      const imageURL = canvass[k4].toDataURL("image/png");
      const img = document.createElement("img");
      img.src = imageURL;
      img.setAttribute("style", "max-width: 100%;");
      img.className = "isNeedRemove";
      const parentNode = canvass[k4].parentNode;
      if (parentNode)
        parentNode.insertBefore(img, canvass[k4].nextElementSibling);
    }

    return this.dom?.outerHTML || "";
  },
  /**
    create iframe
  */
  writeIframe: function (this: PrintInstance, content: string) {
    const iframe: HTMLIFrameElement = document.createElement("iframe");
    const f: HTMLIFrameElement = document.body.appendChild(iframe);
    iframe.id = "myIframe";
    iframe.setAttribute(
      "style",
      "position:absolute;width:0;height:0;top:-10px;left:-10px;"
    );
    const w = f.contentWindow;
    const doc = f.contentDocument ?? w?.document;
    if (!doc) return;
    doc.open();
    doc.write(content);
    doc.close();

    const removes = document.querySelectorAll(".isNeedRemove");
    for (let k = 0; k < removes.length; k++) {
      removes[k].parentNode?.removeChild(removes[k]);
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    iframe.onload = function (): void {
      // Before popping, callback
      if (_this.conf.printBeforeFn) {
        _this.conf.printBeforeFn({ doc });
      }
      if (w) _this.toPrint(w);
      setTimeout(function () {
        document.body.removeChild(iframe);
        // After popup, callback
        if (_this.conf.printDoneCallBack) {
          _this.conf.printDoneCallBack();
        }
      }, 100);
    };
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
      console.error(err);
    }
  },
  isDOM:
    typeof HTMLElement === "object"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function (obj: any) {
          return obj instanceof HTMLElement;
        }
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function (obj: any) {
          return (
            obj &&
            typeof obj === "object" &&
            obj.nodeType === 1 &&
            typeof obj.nodeName === "string"
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
