import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";

vi.mock("@/utils/http", () => import("../../../tests/mocks/http"));
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

const componentModules = import.meta.glob<{ default: Component }>(
  "../**/*.vue"
);
const smokePrefix = process.env.SMOKE_PREFIX;
const entries = Object.entries(componentModules).filter(
  ([path]) => !smokePrefix || path.includes(smokePrefix)
);

describe("view component smoke coverage", () => {
  it.each(entries)(
    "%s renders with its default props",
    async (_path, loader) => {
      await mountSmokeComponent(loader, _path);
    }
  );
});
