import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";

const qr = vi.hoisted(() => ({
  toCanvas: vi.fn(async (canvas: HTMLCanvasElement) => {
    canvas.width = 10;
    canvas.height = 10;
    return canvas;
  }),
  toDataURL: vi.fn(async () => "data:image/png;base64,qr")
}));
vi.mock("qrcode", () => ({ default: qr, ...qr }));

const drawContext = () => ({
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  arcTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  drawImage: vi.fn(),
  createPattern: vi.fn(() => ({ pattern: true })),
  fillStyle: "" as string | CanvasPattern
});

describe("ReQrcode", () => {
  const originalImage = window.Image;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => drawContext())
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: vi.fn(() => "data:image/png;base64,canvas")
    });
    class ImageStub {
      onload: (() => void) | null = null;
      crossOrigin: string | null = null;
      setAttribute = vi.fn();
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: ImageStub
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: originalImage
    });
  });

  it("renders a canvas, emits done and click", async () => {
    const { default: Qrcode } = await import("../src/index");
    const wrapper = mount(Qrcode, {
      props: { text: "short", width: 128 },
      global: {
        stubs: { "iconify-icon-offline": true },
        directives: { loading: {} }
      }
    });
    await flushPromises();
    await nextTick();
    expect(qr.toCanvas).toHaveBeenCalled();
    expect(wrapper.emitted("done")?.[0]).toEqual([
      "data:image/png;base64,canvas"
    ]);
    await wrapper.find("canvas").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
    expect(wrapper.find(".qrcode").attributes("style")).toContain("128px");
  });

  it("selects correction levels from text length", async () => {
    const { default: Qrcode } = await import("../src/index");
    const wrapper = mount(Qrcode, {
      props: { text: "x".repeat(20) },
      global: { directives: { loading: {} } }
    });
    await flushPromises();
    expect(qr.toCanvas.mock.calls.at(-1)?.[2]).toMatchObject({
      errorCorrectionLevel: "Q"
    });
    await wrapper.setProps({ text: "x".repeat(40) });
    await flushPromises();
    expect(qr.toCanvas.mock.calls.at(-1)?.[2]).toMatchObject({
      errorCorrectionLevel: "M"
    });
  });

  it("renders an image QR code and forwards disabled click", async () => {
    const { default: Qrcode } = await import("../src/index");
    const wrapper = mount(Qrcode, {
      props: {
        tag: "img",
        text: "image",
        disabled: true,
        disabledText: "expired"
      },
      global: {
        stubs: { "iconify-icon-offline": true },
        directives: { loading: {} }
      }
    });
    await flushPromises();
    expect(qr.toDataURL).toHaveBeenCalledWith(
      "image",
      expect.objectContaining({ width: 200, errorCorrectionLevel: "H" })
    );
    expect(wrapper.find("img").attributes("src")).toBe(
      "data:image/png;base64,qr"
    );
    expect(wrapper.text()).toContain("expired");
    await wrapper.find(".qrcode--disabled").trigger("click");
    expect(wrapper.emitted("disabled-click")).toHaveLength(1);
  });

  it("draws square and rounded logo treatments", async () => {
    const { default: Qrcode } = await import("../src/index");
    const square = mount(Qrcode, {
      props: {
        text: "logo",
        logo: "data:image/png;base64,logo",
        options: { color: { dark: "#000" } }
      },
      global: { directives: { loading: {} } }
    });
    await flushPromises();
    expect(square.emitted("done")?.[0]).toEqual([
      "data:image/png;base64,canvas"
    ]);

    const rounded = mount(Qrcode, {
      props: {
        text: "logo",
        logo: { src: "logo.png", logoRadius: 99, borderRadius: 100 }
      },
      global: { directives: { loading: {} } }
    });
    await flushPromises();
    expect(rounded.emitted("done")?.[0]).toEqual([
      "data:image/png;base64,canvas"
    ]);
  });

  it("keeps loading for empty text and handles zero width", async () => {
    const { default: Qrcode } = await import("../src/index");
    const wrapper = mount(Qrcode, {
      props: { text: "", width: 0 },
      global: { directives: { loading: {} } }
    });
    await flushPromises();
    expect(qr.toCanvas).not.toHaveBeenCalled();
    await wrapper.setProps({ text: "now" });
    await flushPromises();
    expect(qr.toCanvas.mock.calls.at(-1)?.[2]?.scale).toBeUndefined();
  });
});
