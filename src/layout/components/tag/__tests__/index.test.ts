import { nextTick, reactive, ref } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";
import TagView from "../index.vue";

const mocks = vi.hoisted(() => ({
  closeMenu: vi.fn(),
  handleAliveRoute: vi.fn(),
  getTopMenu: vi.fn(),
  progressStart: vi.fn(),
  progressDone: vi.fn(),
  onContentFullScreen: vi.fn(),
  onMouseenter: vi.fn(),
  onMouseleave: vi.fn(),
  mounted: vi.fn(),
  emitterOn: vi.fn(),
  emitterOff: vi.fn(),
  resize: vi.fn(),
  hiddenSideBar: false,
  changeSetting: vi.fn()
}));

let state: any;
let tags: any[];

vi.mock("@/layout/hooks/useTag", () => ({
  useTags: () => state
}));
vi.mock("@/vueuse/core", async importOriginal => ({
  ...(await importOriginal<typeof import("@vueuse/core")>()),
  onClickOutside: vi.fn(),
  useResizeObserver: mocks.resize
}));
vi.mock("@/utils/mitt", () => ({
  emitter: { on: mocks.emitterOn, off: mocks.emitterOff }
}));
vi.mock("@/utils/progress", () => ({
  default: { start: mocks.progressStart, done: mocks.progressDone }
}));
vi.mock("@/router/utils", () => ({
  handleAliveRoute: mocks.handleAliveRoute,
  getTopMenu: mocks.getTopMenu
}));
vi.mock("@/store/modules/setting", () => ({}));
vi.mock("@/store/modules/settings", () => ({
  useSettingStoreHook: () => ({
    hiddenSideBar: mocks.hiddenSideBar,
    changeSetting: mocks.changeSetting
  })
}));
vi.mock("@/store/modules/multiTags", () => ({
  useMultiTagsStoreHook: () => ({
    multiTags: tags,
    handleTags: vi.fn((mode: string, value?: any, position?: any) => {
      if (mode === "push") tags.push(value);
      if (mode === "equal")
        tags.splice(0, tags.length, ...(Array.isArray(value) ? value : []));
      if (mode === "splice")
        tags.splice(position?.startIndex ?? 0, position?.length ?? 1);
      if (mode === "slice") return tags.slice(-1);
      return tags;
    })
  })
}));

function makeRoute(overrides: Record<string, any> = {}) {
  return reactive({
    path: "/current",
    fullPath: "/current",
    name: "current",
    meta: { title: "Current" },
    query: {},
    params: {},
    ...overrides
  });
}

function tag(path: string, overrides: Record<string, any> = {}) {
  return {
    path,
    name: path.slice(1) || "home",
    meta: { title: path },
    query: undefined,
    params: undefined,
    ...overrides
  };
}

async function mount(overrides: Record<string, any> = {}) {
  const route = makeRoute(overrides.route);
  const router = {
    options: {
      routes: [
        {
          path: "/group",
          name: "group",
          children: [
            {
              path: "/target",
              name: "target",
              meta: {
                title: "Target",
                icon: "ep:target",
                showLink: true,
                auths: ["target"]
              }
            }
          ]
        }
      ]
    },
    push: vi.fn(async () => undefined),
    replace: vi.fn(async () => undefined)
  };
  state = {
    route,
    router,
    visible: ref(false),
    showTags: ref(false),
    instance: { refs: {} } as any,
    multiTags: ref(tags),
    tagsViews: reactive(
      Array.from({ length: 7 }, (_, index) => ({
        icon: "icon",
        text: `menu-${index}`,
        divided: false,
        disabled: false,
        show: true
      }))
    ),
    buttonTop: ref(0),
    buttonLeft: ref(0),
    showModel: ref("card"),
    translateX: ref(0),
    pureSetting: { hiddenSideBar: false },
    activeIndex: ref(-1),
    getTabStyle: { transform: "none" },
    isScrolling: ref(false),
    iconIsActive: vi.fn(() => true),
    linkIsActive: vi.fn(() => "is-active"),
    currentSelect: ref(null),
    scheduleIsActive: vi.fn(() => "schedule-active"),
    getContextMenuStyle: {},
    closeMenu: mocks.closeMenu,
    onMounted: mocks.mounted,
    onMouseenter: mocks.onMouseenter,
    onMouseleave: mocks.onMouseleave,
    onContentFullScreen: mocks.onContentFullScreen
  };
  return mountSmokeComponent(
    async () => ({ default: TagView }),
    "layout/components/tag/index.vue",
    {
      keepMounted: true,
      allowRenderErrors: true
    }
  );
}

function setupOf(wrapper: Awaited<ReturnType<typeof mount>>) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

function elementAt(left: number, width: number) {
  const element = document.createElement("div");
  Object.defineProperty(element, "offsetLeft", { value: left });
  Object.defineProperty(element, "offsetWidth", { value: width });
  return element;
}

function setElementMetrics(element: Element, left: number, width: number) {
  Object.defineProperty(element, "offsetLeft", {
    value: left,
    configurable: true
  });
  Object.defineProperty(element, "offsetWidth", {
    value: width,
    configurable: true
  });
}

function setTagGeometry(
  wrapper: Awaited<ReturnType<typeof mount>>,
  item: Element,
  left: number,
  width: number
) {
  setElementMetrics(wrapper.vm.$refs.tabDom as Element, 0, 500);
  setElementMetrics(wrapper.vm.$refs.scrollbarDom as Element, 0, 200);
  setElementMetrics(item, left, width);
}

describe("layout tag view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      })
    );
    tags = [tag("/home"), tag("/current"), tag("/next")];
    mocks.getTopMenu.mockReturnValue({
      path: "/home",
      name: "home",
      meta: { title: "Home" }
    });
    mocks.mounted.mockImplementation((callback: () => void) => callback());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("finds tabs by query and brings an offscreen tab into view", async () => {
    tags[1].query = { page: "2" };
    const wrapper = await mount({ route: { query: { page: "2" } } });
    const setup = setupOf(wrapper);
    const item = wrapper.findAll(".scroll-item")[1].element;
    state.instance.refs = { dynamic1: item };
    setTagGeometry(wrapper, item, 300, 80);
    setup.translateX = -50;

    await setup.dynamicTagView();

    expect(setup.translateX).toBe(-190);
    expect(setup.isShowArrow).toBe(true);
    wrapper.unmount();
  });

  it("finds tabs by params and scrolls them in from the left", async () => {
    tags[1].params = { id: "42" };
    const wrapper = await mount({ route: { params: { id: "42" } } });
    const setup = setupOf(wrapper);
    const item = wrapper.findAll(".scroll-item")[1].element;
    state.instance.refs = { dynamic1: item };
    setTagGeometry(wrapper, item, 90, 80);
    setup.translateX = -150;

    await setup.dynamicTagView();

    expect(setup.translateX).toBe(-80);
    expect(setup.isShowArrow).toBe(true);
    wrapper.unmount();
  });

  it("falls back to the path match for every visibility boundary", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);
    const item = wrapper.findAll(".scroll-item")[1].element;
    state.instance.refs = { dynamic1: item };
    setTagGeometry(wrapper, item, -10, 80);
    setup.translateX = 0;

    await setup.dynamicTagView();
    expect(setup.translateX).toBe(20);

    setElementMetrics(item, 50, 80);
    setup.translateX = -40;
    await setup.dynamicTagView();
    expect(setup.translateX).toBe(0);

    setElementMetrics(item, 180, 80);
    setup.translateX = -40;
    await setup.dynamicTagView();
    expect(setup.translateX).toBe(-70);
    wrapper.unmount();
  });

  it("leaves the scroll position unchanged when no tab matches the route", async () => {
    const wrapper = await mount({ route: { path: "/absent" } });
    const setup = setupOf(wrapper);
    setup.translateX = -25;

    await setup.dynamicTagView();

    expect(setup.translateX).toBe(-25);
    wrapper.unmount();
  });

  it("guards missing tab elements and container dimensions", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);
    state.instance = null;
    expect(setup.moveToView).toBeTypeOf("function");
    await setup.dynamicTagView();
    state.instance = { refs: { dynamic0: "not-an-element" } };
    setup.tabDom = null;
    setup.scrollbarDom = null;
    await setup.moveToView(0);

    expect(setup.translateX).toBe(0);
    wrapper.unmount();
  });

  it("scrolls in both directions and clamps to the available width", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);
    setup.tabDom = elementAt(0, 500);
    setup.scrollbarDom = elementAt(0, 200);
    setup.translateX = -100;
    setup.isScrolling = true;
    setup.handleScroll(30);
    expect(setup.translateX).toBe(-70);
    expect(setup.isScrolling).toBe(false);

    setup.isScrolling = true;
    setup.handleScroll(-400);
    expect(setup.translateX).toBe(-300);

    setup.translateX = -250;
    setup.handleScroll(-20);
    expect(setup.translateX).toBe(-270);

    setup.tabDom = elementAt(0, 100);
    setup.scrollbarDom = elementAt(0, 200);
    setup.translateX = -3;
    setup.handleScroll(-10);
    expect(setup.translateX).toBe(0);

    setup.tabDom = null;
    setup.scrollbarDom = null;
    setup.handleScroll(20);
    expect(setup.translateX).toBe(0);
    wrapper.unmount();
  });

  it("maps wheel axes and intensity to animated scrolling", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);
    setup.tabDom = elementAt(0, 500);
    setup.scrollbarDom = elementAt(0, 200);
    setup.translateX = -100;

    setup.handleWheel(new WheelEvent("wheel", { deltaX: -30, deltaY: -5 }));
    expect(setup.isScrolling).toBe(false);
    expect(setup.translateX).toBe(-65);

    setup.handleWheel(new WheelEvent("wheel", { deltaX: -1, deltaY: -1 }));
    expect(setup.translateX).toBe(-63);
    setup.handleWheel(new WheelEvent("wheel", { deltaX: 0, deltaY: 0 }));
    expect(setup.translateX).toBe(-163);

    wrapper.unmount();
  });

  it("pushes nested routes into the tag store only when absent", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);

    setup.dynamicRouteTag("/target");
    expect(tags.some(item => item.path === "/target")).toBe(true);
    const pushed = tags.find(item => item.path === "/target");
    expect(pushed).toMatchObject({
      name: "target",
      meta: { title: "Target", icon: "ep:target" }
    });

    const length = tags.length;
    setup.dynamicRouteTag("/target");
    expect(tags).toHaveLength(length);
    wrapper.unmount();
  });

  it("refreshes the current route and exposes progress around navigation", async () => {
    const wrapper = await mount({
      route: { fullPath: "/current?tab=1", query: { tab: "1" } }
    });
    const setup = setupOf(wrapper);

    setup.onFresh();

    expect(mocks.progressStart).toHaveBeenCalled();
    expect(setup.router.replace).toHaveBeenCalledWith({
      path: "/redirect/current?tab=1",
      query: { tab: "1" }
    });
    expect(mocks.handleAliveRoute).toHaveBeenCalledWith(setup.route, "refresh");
    expect(mocks.progressDone).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("closes current, left, right, other and all tabs with disabled guards", async () => {
    const wrapper = await mount({
      route: { path: "/current", fullPath: "/current" }
    });
    const setup = setupOf(wrapper);
    tags.splice(
      0,
      tags.length,
      tag("/home"),
      tag("/left", { query: { q: 1 } }),
      tag("/current", { params: { id: 1 } }),
      tag("/right")
    );

    setup.selectTag(1, { disabled: true });
    expect(setup.router.push).not.toHaveBeenCalled();

    state.currentSelect.value = tags[1];
    expect(state.currentSelect.value).not.toBeNull();
    setup.selectTag(1, { disabled: false });
    expect(mocks.closeMenu).toHaveBeenCalled();
    expect(tags.some(item => item.path === "/left")).toBe(false);

    setup.onClickDrop(1, { disabled: false }, tag("/right"));
    setup.onClickDrop(2, null, tag("/right"));
    setup.onClickDrop(3, null, tag("/right"));
    setup.onClickDrop(4, null, tag("/current"));

    setup.onClickDrop(5, null);
    expect(setup.router.push).toHaveBeenCalledWith("/home");
    vi.runOnlyPendingTimers();
    wrapper.unmount();
  });

  it("chooses query, params and path routes after deletion branches", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);

    tags.splice(
      0,
      tags.length,
      tag("/home", { query: { q: 1 } }),
      tag("/current")
    );
    setup.deleteDynamicTag(tag("/current"), "/current");
    expect(setup.router.push).toHaveBeenCalledWith({
      name: "home",
      query: { q: 1 }
    });

    setup.router.push.mockClear();
    tags.splice(
      0,
      tags.length,
      tag("/home", { params: { id: 2 } }),
      tag("/current")
    );
    setup.deleteDynamicTag(tag("/current"), "/current");
    expect(setup.router.push).toHaveBeenCalledWith({
      name: "home",
      params: { id: 2 }
    });

    setup.router.push.mockClear();
    tags.splice(0, tags.length, tag("/home"), tag("/current"), tag("/right"));
    setup.deleteDynamicTag(tag("/current"), "/current", "right");
    tags.splice(0, tags.length, tag("/home"), tag("/current"), tag("/right"));
    setup.deleteDynamicTag(tag("/right"), "/current", "other");
    expect(setup.router.push).toHaveBeenCalledWith({ path: "/right" });
    wrapper.unmount();
  });

  it("returns safely when deleting current or unrelated tags leaves no destination", async () => {
    const wrapper = await mount({ route: { path: "/current" } });
    const setup = setupOf(wrapper);

    setup.route.path = "/current";
    tags.splice(0, tags.length);
    setup.deleteDynamicTag(tag("/current"), "/current");
    expect(setup.router.push).not.toHaveBeenCalled();

    tags.splice(0, tags.length, tag("/current"));
    setup.deleteDynamicTag(tag("/current"), "/current", "left");
    expect(setup.router.push).not.toHaveBeenCalled();

    setup.route.path = "/elsewhere";
    tags.splice(0, tags.length, tag("/current"));
    setup.deleteDynamicTag(tag("/current"), "/current");
    expect(setup.router.push).not.toHaveBeenCalled();

    tags.push(tag("/elsewhere"));
    tags.splice(0, tags.length);
    setup.deleteDynamicTag(tag("/current"), "/current");
    expect(setup.router.push).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("calculates context menu visibility for every boundary case", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);

    tags.splice(0, tags.length, tag("/home"), tag("/current"), tag("/right"));
    setup.showMenuModel("/current");
    expect(state.tagsViews[2].show).toBe(false);

    setup.showMenuModel("/current", {}, true);
    expect(state.tagsViews[0].show).toBe(true);

    tags.splice(0, tags.length, tag("/home"), tag("/current"));
    setup.showMenuModel("/current");
    expect(state.tagsViews[2].show).toBe(false);

    setup.showMenuModel("/home");
    expect(state.tagsViews.slice(1, 6).every(item => item.disabled)).toBe(true);

    setup.showMenuModel("/redirect/home");
    expect(state.tagsViews.slice(1, 6).every(item => item.disabled)).toBe(true);

    tags.push(tag("/right"));
    setup.showMenuModel("/right", { q: 1 });
    expect(state.tagsViews.some(item => !item.disabled)).toBe(true);
    wrapper.unmount();
  });

  it("opens context menus for top-level, inactive, two-tab and active tags", async () => {
    const wrapper = await mount({ route: { path: "/other" } });
    const setup = setupOf(wrapper);
    const container = elementAt(10 * 0, 100);
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({ left: 10 }),
      configurable: true
    });
    Object.defineProperty(container, "offsetWidth", { value: 100 });
    setup.containerDom = container;
    setup.route.path = "/other";
    setup.route.name = "other";
    tags.splice(
      0,
      tags.length,
      tag("/home"),
      tag("/one"),
      tag("/two"),
      tag("/three")
    );

    setup.openMenu(tag("/home"), { clientX: 50, clientY: 60 });
    expect(state.tagsViews[0].show).toBe(true);

    setup.openMenu(tag("/two"), { clientX: 500, clientY: 60 });
    expect(setup.buttonLeft).toBe(-40);
    expect(setup.buttonTop).toBe(20);

    setup.route.path = "/two";
    setup.route.name = "two";
    setup.openMenu(tag("/two"), { clientX: 20, clientY: 60 });
    expect(state.tagsViews[0].show).toBe(true);

    tags.splice(0, tags.length, tag("/home"), tag("/two"));
    setup.route.path = "/three";
    setup.openMenu(tag("/two"), { clientX: 20, clientY: 60 });
    expect(state.tagsViews[4].show).toBe(false);

    mocks.hiddenSideBar = true;
    setup.openMenu(tag("/two"), { clientX: 20, clientY: 60 });
    expect(setup.buttonTop).toBe(60);
    vi.runOnlyPendingTimers();
    wrapper.unmount();
  });

  it("navigates tags by name with query, params and path fallbacks", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);

    setup.tagOnClick(tag("/one", { name: "one", query: { q: 1 } }));
    setup.tagOnClick(tag("/one", { name: "one", params: { id: 1 } }));
    setup.tagOnClick(tag("/one", { name: "one" }));
    setup.tagOnClick(tag("/one", { name: "" }));

    expect(setup.router.push).toHaveBeenNthCalledWith(1, {
      name: "one",
      query: { q: 1 }
    });
    expect(setup.router.push).toHaveBeenNthCalledWith(2, {
      name: "one",
      params: { id: 1 }
    });
    expect(setup.router.push).toHaveBeenNthCalledWith(3, { name: "one" });
    expect(setup.router.push).toHaveBeenNthCalledWith(4, { path: "/one" });
    wrapper.unmount();
  });

  it("wires resize, delay and emitter events and cleans them up", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);

    expect(mocks.mounted).toHaveBeenCalled();
    expect(mocks.emitterOn).toHaveBeenCalledWith(
      "tagViewsChange",
      expect.any(Function)
    );
    const viewsHandler = mocks.emitterOn.mock.calls.find(
      call => call[0] === "tagViewsChange"
    )[1];
    const modelHandler = mocks.emitterOn.mock.calls.find(
      call => call[0] === "tagViewsShowModel"
    )[1];
    const routeHandler = mocks.emitterOn.mock.calls.find(
      call => call[0] === "changLayoutRoute"
    )[1];

    viewsHandler(false);
    expect(setup.showTags).toBe(false);
    modelHandler("smart");
    expect(setup.showModel).toBe("smart");
    routeHandler("/target");
    expect(tags.some(item => item.path === "/target")).toBe(true);
    vi.runOnlyPendingTimers();

    wrapper.unmount();
    expect(mocks.emitterOff).toHaveBeenCalledTimes(3);
  });

  it("renders tabs, menu entries and emits DOM interactions", async () => {
    const wrapper = await mount();
    const setup = setupOf(wrapper);
    setup.translateX = -2;

    expect(wrapper.text()).toContain("/current");
    const items = wrapper.findAll(".scroll-item");
    expect(items.length).toBe(tags.length);
    await items[1].trigger("click");
    await items[1].trigger("mouseenter");
    await items[1].trigger("mouseleave");
    await items[1].trigger("contextmenu");
    await items[1].find(".el-icon-close").trigger("click");

    expect(setup.router.push).toHaveBeenCalled();
    expect(mocks.onMouseenter).toHaveBeenCalled();
    expect(mocks.onMouseleave).toHaveBeenCalled();
    expect(wrapper.findAll(".contextmenu li").length).toBeGreaterThan(0);
    wrapper.unmount();
  });
});
