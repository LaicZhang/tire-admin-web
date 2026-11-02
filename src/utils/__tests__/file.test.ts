import { compressImage, dataURLtoFile, getImageWH } from "../file";

describe("file helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("converts data urls and falls back to octet-stream", async () => {
    vi.stubGlobal("atob", (value: string) =>
      Buffer.from(value, "base64").toString("binary")
    );
    const png = dataURLtoFile("data:image/png;base64,AAAA", "a.png");
    expect(png.name).toBe("a.png");
    expect(png.type).toBe("image/png");
    expect(png.size).toBe(3);
    const unknown = dataURLtoFile("data:;base64,AA==", "a.bin");
    expect(unknown.type).toBe("application/octet-stream");
  });

  it("reads image dimensions", async () => {
    vi.stubGlobal(
      "FileReader",
      class {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL() {
          queueMicrotask(() =>
            this.onload?.({
              target: { result: "data:image/png;base64,AAAA" }
            } as any)
          );
        }
      }
    );
    const OriginalImage = globalThis.Image;
    class FakeImage {
      width = 640;
      height = 480;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);
    await expect(getImageWH(new File(["a"], "a.png"))).resolves.toEqual({
      width: 640,
      height: 480
    });
    vi.stubGlobal("Image", OriginalImage);
  });

  it("compresses through canvas", async () => {
    vi.stubGlobal("atob", (value: string) =>
      Buffer.from(value, "base64").toString("binary")
    );
    vi.stubGlobal(
      "FileReader",
      class {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL() {
          queueMicrotask(() =>
            this.onload?.({
              target: { result: "data:image/png;base64,AAAA" }
            } as any)
          );
        }
      }
    );
    class FakeImage {
      width = 20;
      height = 10;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);
    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => "data:image/jpeg;base64,AAAA");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage
    } as any);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
      toDataURL
    );
    const result = await compressImage(new File(["a"], "photo.png"), 0.5);
    expect(result.dimensions).toEqual({ width: 20, height: 10 });
    expect(result.file.type).toBe("image/jpeg");
    expect(drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 0, 0, 20, 10);
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.5);
  });

  it("rejects reads, image loads and missing canvas contexts", async () => {
    class ErrorReader {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal("FileReader", ErrorReader);
    await expect(getImageWH(new File(["a"], "a"))).rejects.toThrow(
      "Failed to read file"
    );

    class LoadReader {
      onload: ((event: any) => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        queueMicrotask(() => this.onload?.({ target: { result: "data:" } }));
      }
    }
    vi.stubGlobal("FileReader", LoadReader);
    class ErrorImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal("Image", ErrorImage);
    await expect(getImageWH(new File(["a"], "a"))).rejects.toThrow(
      "Failed to load image"
    );

    class SmallImage {
      width = 1;
      height = 1;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", SmallImage);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    await expect(compressImage(new File(["a"], "a"))).rejects.toThrow(
      "Failed to get canvas context"
    );
  });
});
