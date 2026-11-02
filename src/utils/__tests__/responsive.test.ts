import type { App } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getData: vi.fn()
}));

vi.mock("responsive-storage", () => ({
  default: { getData: mocks.getData }
}));
vi.mock("@/config", () => ({
  responsiveStorageNameSpace: () => "responsive-"
}));

import { injectResponsiveStorage } from "../responsive";

const config = (patch: Partial<PlatformConfigs> = {}) =>
  ({
    Layout: "vertical",
    Theme: "light",
    DarkMode: false,
    SidebarStatus: true,
    EpThemeColor: "#409EFF",
    OverallStyle: "light",
    Grey: false,
    Weak: false,
    HideTabs: false,
    HideFooter: true,
    ShowLogo: true,
    ShowModel: "smart",
    MultiTagsCache: false,
    Stretch: false,
    ...patch
  }) as PlatformConfigs;

beforeEach(() => {
  mocks.getData.mockReset();
});

describe("injectResponsiveStorage", () => {
  it("applies safe defaults when no persisted values exist", () => {
    mocks.getData.mockReturnValue(undefined);
    const app = { use: vi.fn() } as unknown as App;

    injectResponsiveStorage(app, config());

    expect(mocks.getData).toHaveBeenCalledWith("layout", "responsive-");
    expect(mocks.getData).toHaveBeenCalledWith("configure", "responsive-");
    expect(app.use).toHaveBeenCalledWith(expect.anything(), {
      nameSpace: "responsive-",
      memory: {
        layout: {
          layout: "vertical",
          theme: "light",
          darkMode: false,
          sidebarStatus: true,
          epThemeColor: "#409EFF",
          themeColor: "light",
          overallStyle: "light"
        },
        configure: {
          grey: false,
          weak: false,
          hideTabs: false,
          hideFooter: true,
          showLogo: true,
          showModel: "smart",
          multiTagsCache: false,
          stretch: false
        }
      }
    });
  });

  it("uses configured defaults and persisted layout, configure and tags", () => {
    const cachedLayout = { layout: "horizontal", theme: "dark" };
    const cachedConfigure = { grey: true };
    const cachedTags = [{ path: "/cached" }];
    mocks.getData.mockImplementation((key: string) => {
      if (key === "layout") return cachedLayout;
      if (key === "configure") return cachedConfigure;
      if (key === "tags") return cachedTags;
      return null;
    });
    const app = { use: vi.fn() } as unknown as App;

    injectResponsiveStorage(
      app,
      config({
        Layout: "horizontal",
        Theme: "dark",
        DarkMode: true,
        SidebarStatus: false,
        EpThemeColor: "#000000",
        OverallStyle: "dark",
        Grey: true,
        Weak: true,
        HideTabs: true,
        HideFooter: false,
        ShowLogo: false,
        ShowModel: "simple",
        MultiTagsCache: true,
        Stretch: true
      })
    );

    expect(app.use).toHaveBeenCalledWith(expect.anything(), {
      nameSpace: "responsive-",
      memory: {
        layout: cachedLayout,
        configure: cachedConfigure,
        tags: cachedTags
      }
    });
  });

  it("uses router tag defaults when multi-tag cache is enabled without storage", () => {
    mocks.getData.mockReturnValue(null);
    const app = { use: vi.fn() } as unknown as App;

    injectResponsiveStorage(app, config({ MultiTagsCache: true }));

    const options = (app.use as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(options.memory.tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "/welcome" })])
    );
    expect(options.memory.layout.layout).toBe("vertical");
  });
});
