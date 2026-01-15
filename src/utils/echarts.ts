export type EChartsModule = typeof import("echarts");

let echartsModulePromise: Promise<EChartsModule> | null = null;

export function getEcharts() {
  echartsModulePromise ||= import("echarts");
  return echartsModulePromise;
}
