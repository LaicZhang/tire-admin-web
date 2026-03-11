export type EChartsModule = typeof import("echarts/core");

let echartsInstancePromise: Promise<EChartsModule> | null = null;

export function getEcharts(): Promise<EChartsModule> {
  if (!echartsInstancePromise) {
    echartsInstancePromise = import("@/plugins/echarts").then(m => m.default);
  }
  return echartsInstancePromise;
}
