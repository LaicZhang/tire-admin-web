import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  device: "desktop",
  viewportWidth: 1400,
  mediaMatches: false,
  addMediaListener: vi.fn(),
  removeMediaListener: vi.fn(),
  setLayout: vi.fn(),
  multiTagsCacheChange: vi.fn(),
  emit: vi.fn(),
  toggleClass: vi.fn(
    (flag: boolean, className: string, target: HTMLElement) => {
      target.classList.toggle(className, flag);
    }
  ),
  dataThemeChange: vi.fn(),
  setLayoutThemeColor: vi.fn(),
  dataThemeRef: null as any,
  overallStyleRef: null as any,
  layoutThemeRef: null as any,
  storage: {
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
}));

vi.mock("@/layout/hooks/useNav", async () => {
  const { computed } = await import("vue");
  return { useNav: () => ({ device: computed(() => mocks.device) }) };
});
vi.mock("@/layout/hooks/useDataThemeChange", async () => {
  const { computed, reactive, ref } = await import("vue");
  mocks.storage = reactive(mocks.storage) as typeof mocks.storage;
  return {
    useDataThemeChange: () => {
      mocks.dataThemeRef = ref(Boolean(mocks.storage.layout.darkMode));
      mocks.overallStyleRef = ref(mocks.storage.layout.overallStyle);
      mocks.layoutThemeRef = ref({ ...mocks.storage.layout });
      return {
        dataTheme: mocks.dataThemeRef,
        overallStyle: mocks.overallStyleRef,
        layoutTheme: mocks.layoutThemeRef,
        themeColors: ref([
          { color: "#fff", themeColor: "light" },
          { color: "#111", themeColor: "default" }
        ]),
        toggleClass: mocks.toggleClass,
        dataThemeChange: mocks.dataThemeChange,
        setLayoutThemeColor: mocks.setLayoutThemeColor,
        getThemeColor: computed(() => () => "transparent")
      };
    }
  };
});
vi.mock("@/store/modules/app", () => ({
  useAppStoreHook: () => ({
    setLayout: mocks.setLayout,
    get getViewportWidth() {
      return mocks.viewportWidth;
    }
  })
}));
vi.mock("@/store/modules/multiTags", () => ({
  useMultiTagsStoreHook: () => ({
    multiTagsCacheChange: mocks.multiTagsCacheChange
  })
}));
vi.mock("@/utils/mitt", () => ({ emitter: { emit: mocks.emit } }));
vi.mock("@pureadmin/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@pureadmin/utils")>()),
  useDark: () => ({ isDark: ref(false) }),
  useGlobal: () => ({ $storage: mocks.storage }),
  debounce: (fn: () => void) => fn,
  toggleClass: mocks.toggleClass,
  isNumber: (value: unknown) => typeof value === "number"
}));

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: () => ({
    get matches() {
      return mocks.mediaMatches;
    },
    addEventListener: mocks.addMediaListener,
    removeEventListener: mocks.removeMediaListener
  })
});

const PanelStub = defineComponent({
  setup(_, { slots }) {
    return () => h("section", { class: "panel" }, slots.default?.());
  }
});
const SegmentedStub = defineComponent({
  props: { options: { type: Array, default: () => [] }, modelValue: Number },
  emits: ["change"],
  setup(props, { emit }) {
    return () =>
      h(
        "div",
        { class: "segmented" },
        (props.options as Record<string, any>[]).map((option, index) =>
          h(
            "button",
            {
              type: "button",
              onClick: () => emit("change", { index, option })
            },
            String(option.label)
          )
        )
      );
  }
});

async function mountPanel() {
  return mountSmokeComponent(
    async () => ({ default: (await import("../index.vue")).default }),
    "layout/components/setting/index.vue",
    {
      keepMounted: true,
      globalStubs: {
        panel: PanelStub,
        Panel: PanelStub,
        Segmented: SegmentedStub,
        "re-segmented": SegmentedStub
      }
    }
  );
}
const state = (wrapper: Awaited<ReturnType<typeof mountPanel>>) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.device = "desktop";
  mocks.viewportWidth = 1400;
  mocks.mediaMatches = false;
  mocks.storage.layout = {
    layout: "vertical",
    theme: "light",
    darkMode: false,
    sidebarStatus: true,
    epThemeColor: "#409EFF",
    themeColor: "light",
    overallStyle: "light"
  };
  mocks.storage.configure = {
    grey: false,
    weak: false,
    hideTabs: false,
    hideFooter: true,
    showLogo: true,
    showModel: "smart",
    multiTagsCache: false,
    stretch: false
  };
  document.documentElement.className = "";
  document.body.removeAttribute("layout");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      get matches() {
        return mocks.mediaMatches;
      },
      addEventListener: mocks.addMediaListener,
      removeEventListener: mocks.removeMediaListener
    })
  });
});
afterEach(() => {
  document.body.innerHTML = "";
});

describe("layout setting behavior", () => {
  it("restores enabled display settings and synchronizes system theme", async () => {
    mocks.storage.layout.overallStyle = "system";
    Object.assign(mocks.storage.configure, {
      grey: true,
      weak: true,
      hideTabs: true,
      hideFooter: true
    });
    const wrapper = await mountPanel();
    try {
      await nextTick();
      expect(document.documentElement.classList.contains("html-grey")).toBe(
        true
      );
      expect(document.documentElement.classList.contains("html-weakness")).toBe(
        true
      );
      expect(mocks.emit).toHaveBeenCalledWith("tagViewsChange", true);
      expect(mocks.storage.configure.hideFooter).toBe(true);
      expect(mocks.removeMediaListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
      expect(mocks.addMediaListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
        {
          passive: true
        }
      );

      expect(state(wrapper).overallStyle).toBe("system");
      mocks.mediaMatches = true;
      const listener = mocks.addMediaListener.mock.calls[0][1] as () => void;
      listener();
      expect(mocks.dataThemeRef.value).toBe(true);
      mocks.mediaMatches = false;
      listener();
      expect(mocks.dataThemeRef.value).toBe(false);
    } finally {
      wrapper.unmount();
    }
    expect(mocks.removeMediaListener).toHaveBeenCalledTimes(2);
  });

  it("applies theme, stretch and tab style segmented choices", async () => {
    const wrapper = await mountPanel();
    try {
      const groups = wrapper.findAll(".segmented");
      expect(groups).toHaveLength(3);
      await groups[0].findAll("button")[1].trigger("click");
      expect(state(wrapper).overallStyle).toBe("dark");
      expect(mocks.dataThemeChange).toHaveBeenCalledWith("dark");

      await groups[0].findAll("button")[2].trigger("click");
      expect(state(wrapper).overallStyle).toBe("system");
      expect(mocks.addMediaListener).toHaveBeenCalled();

      await groups[1].findAll("button")[1].trigger("click");
      expect(state(wrapper).settings.stretch).toBe(1440);
      expect(mocks.storage.configure.stretch).toBe(1440);
      await groups[1].findAll("button")[0].trigger("click");
      expect(state(wrapper).settings.stretch).toBe(false);

      await groups[2].findAll("button")[1].trigger("click");
      expect(state(wrapper).markValue).toBe("card");
      expect(mocks.storage.configure.showModel).toBe("card");
      expect(mocks.emit).toHaveBeenCalledWith("tagViewsShowModel", "card");
      await groups[2].findAll("button")[0].trigger("click");
      expect(state(wrapper).markValue).toBe("smart");
    } finally {
      wrapper.unmount();
    }
  });

  it("updates navigation, theme colors, width and display switches", async () => {
    mocks.storage.layout.theme = "dark";
    const wrapper = await mountPanel();
    const vm = state(wrapper);
    try {
      const layoutItems = wrapper.findAll(".pure-theme li");
      expect(layoutItems).toHaveLength(3);
      await layoutItems[0].trigger("click");
      expect(document.body.getAttribute("layout")).toBe("vertical");
      await layoutItems[1].trigger("click");
      expect(document.body.getAttribute("layout")).toBe("horizontal");
      await layoutItems[2].trigger("click");
      expect(document.body.getAttribute("layout")).toBe("mix");
      expect(mocks.setLayout).toHaveBeenCalledWith("mix");

      await wrapper.findAll(".theme-color li")[1].trigger("click");
      expect(mocks.setLayoutThemeColor).toHaveBeenCalledWith("default");
      expect(mocks.layoutThemeRef.value.theme).toBe("dark");
      expect(vm.layoutTheme.theme).toBe("dark");
      expect(vm.getThemeColor("default")).toBe("transparent");
      expect(vm.getThemeColor("pink")).toBe("transparent");
      mocks.layoutThemeRef.value = {
        ...mocks.layoutThemeRef.value,
        theme: "light"
      };
      await flushPromises();
      expect(vm.getThemeColor("light")).toBe("#1d2b45");
      mocks.layoutThemeRef.value = {
        ...mocks.layoutThemeRef.value,
        theme: "dark"
      };
      await flushPromises();
      expect(vm.getThemeColor("default")).toBe("transparent");
      vm.isDark = true;
      expect(vm.showThemeColors("light")).toBe(false);
      expect(vm.showThemeColors("dark")).toBe(true);

      vm.setStretch(undefined);
      expect(mocks.storage.configure.stretch).toBe(false);
      vm.logoVal = false;
      vm.logoChange();
      expect(mocks.storage.configure.showLogo).toBe(false);
      vm.logoVal = true;
      vm.logoChange();
      expect(mocks.storage.configure.showLogo).toBe(true);

      vm.greyChange(1);
      vm.weekChange(0);
      vm.settings.tabsVal = true;
      vm.tagsChange();
      vm.settings.hideFooter = false;
      vm.hideFooterChange();
      vm.settings.multiTagsCache = 1;
      vm.multiTagsCacheChange();
      expect(document.documentElement.classList.contains("html-grey")).toBe(
        true
      );
      expect(document.documentElement.classList.contains("html-weakness")).toBe(
        false
      );
      expect(mocks.storage.configure.hideTabs).toBe(true);
      expect(mocks.storage.configure.hideFooter).toBe(false);
      expect(mocks.storage.configure.multiTagsCache).toBe(true);
      expect(mocks.multiTagsCacheChange).toHaveBeenCalledWith(true);
    } finally {
      wrapper.unmount();
    }
  });

  it("hides wide-only controls on narrow and mobile layouts", async () => {
    mocks.device = "mobile";
    mocks.viewportWidth = 1024;
    mocks.storage.configure.stretch = true;
    const wrapper = await mountPanel();
    const vm = state(wrapper);
    try {
      expect(wrapper.findAll(".pure-theme li")).toHaveLength(1);
      expect(wrapper.findAll(".segmented")).toHaveLength(2);
      expect(wrapper.find(".el-input-number-stub").exists()).toBe(false);

      vm.setStretch(1280);
      expect(mocks.storage.configure.stretch).toBe(1280);
      vm.onChange({ option: { label: "数字", value: 1 } });
      expect(state(wrapper).markValue).toBe("smart");
      vm.onChange({ option: { label: "卡片", value: "card" } });
      expect(state(wrapper).markValue).toBe("card");
    } finally {
      wrapper.unmount();
    }
  });
});
