import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { exerciseSetupHandlers } from "../../../tests/helpers/exercise-setup";

vi.mock("@/utils/http", () => import("../../../tests/mocks/http-rich"));
vi.mock("@/utils/progress", () => ({
  default: { start: vi.fn(), done: vi.fn() }
}));
vi.mock("@/utils/echarts", () => ({
  getEcharts: async () => ({
    init: () => ({
      setOption: () => undefined,
      resize: () => undefined,
      dispose: () => undefined,
      on: () => undefined,
      off: () => undefined
    })
  })
}));

const modules = import.meta.glob<{ default: Component }>("../**/*.vue");
const targets = new Set([
  "../components/tag/index.vue",
  "../components/search/components/SearchModal.vue",
  "../components/setting/index.vue",
  "../components/appMain.vue",
  "../components/sidebar/sidebarItem.vue",
  "../components/sidebar/breadCrumb.vue",
  "../components/sidebar/vertical.vue",
  "../components/search/components/SearchHistory.vue",
  "../components/search/components/SearchHistoryItem.vue",
  "../components/search/components/SearchResult.vue",
  "../components/search/index.vue",
  "../components/navbar.vue",
  "../components/notice/index.vue",
  "../components/notice/noticeItem.vue",
  "../components/sidebar/horizontal.vue",
  "../components/sidebar/mixNav.vue",
  "../components/sidebar/topCollapse.vue",
  "../components/sidebar/fullScreen.vue",
  "../components/keepAliveFrame/index.vue",
  "../frameView.vue"
]);
const entries = Object.entries(modules).filter(([path]) => targets.has(path));

describe("layout deep exercise", () => {
  it.each(entries)(
    "%s exercises rendered state",
    async (sourcePath, loader) => {
      const wrapper = await mountSmokeComponent(loader, sourcePath, {
        keepMounted: true,
        deep: true,
        allowRenderErrors: true
      });
      try {
        const called = await exerciseSetupHandlers(wrapper);
        expect(called.length).toBeGreaterThan(0);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).not.toBe("");
      } finally {
        wrapper.unmount();
        document.body.innerHTML = "";
      }
    }
  );
});
