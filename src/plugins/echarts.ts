import type { App } from "vue";
import * as echarts from "echarts/core";
import { PieChart, BarChart, LineChart } from "echarts/charts";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import {
  GridComponent,
  TitleComponent,
  PolarComponent,
  LegendComponent,
  GraphicComponent,
  ToolboxComponent,
  TooltipComponent,
  DataZoomComponent,
  VisualMapComponent
} from "echarts/components";

const { use } = echarts;

use([
  PieChart,
  BarChart,
  LineChart,
  /**
   * 渲染器选择说明:
   * - CanvasRenderer: 适合大数据量场景，性能更好
   * - SVGRenderer: 适合需要交互操作（如缩放、选择）的场景，更清晰
   * 同时导入两种渲染器以支持不同业务场景的需求
   */
  CanvasRenderer,
  SVGRenderer,
  GridComponent,
  TitleComponent,
  PolarComponent,
  LegendComponent,
  GraphicComponent,
  ToolboxComponent,
  TooltipComponent,
  DataZoomComponent,
  VisualMapComponent
]);

/**
 * @description 按需引入echarts，具体看 https://echarts.apache.org/handbook/zh/basics/import/#%E5%9C%A8-typescript-%E4%B8%AD%E6%8C%89%E9%9C%80%E5%BC%95%E5%85%A5
 * @see 温馨提示：必须将 `$echarts` 添加到全局 `globalProperties` ，具体看 https://pure-admin-utils.netlify.app/hooks/useECharts/useECharts#%E4%BD%BF%E7%94%A8%E5%89%8D%E6%8F%90
 */
export function useEcharts(app: App) {
  app.config.globalProperties.$echarts = echarts;
}

export default echarts;
