import { reactive, readonly } from "vue";

export type RuntimeErrorKind = "bootstrap" | "router" | "render";

export interface RuntimeErrorPayload {
  kind: RuntimeErrorKind;
  title: string;
  message: string;
  detail?: string;
}

interface RuntimeErrorState extends RuntimeErrorPayload {
  visible: boolean;
  timestamp: number;
}

const initialState: RuntimeErrorState = {
  visible: false,
  kind: "render",
  title: "页面渲染异常",
  message: "当前页面发生异常，请刷新后重试",
  detail: "",
  timestamp: 0
};

const runtimeErrorState = reactive<RuntimeErrorState>({
  ...initialState
});

export function formatRuntimeError(
  error: unknown,
  context?: string,
  fallback = "未知异常"
): string {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  const normalizedDetail = detail.trim() || fallback;
  return context ? `${context}: ${normalizedDetail}` : normalizedDetail;
}

export function showRuntimeError(payload: RuntimeErrorPayload) {
  runtimeErrorState.visible = true;
  runtimeErrorState.kind = payload.kind;
  runtimeErrorState.title = payload.title;
  runtimeErrorState.message = payload.message;
  runtimeErrorState.detail = payload.detail ?? "";
  runtimeErrorState.timestamp = Date.now();
}

export function clearRuntimeError() {
  Object.assign(runtimeErrorState, {
    ...initialState,
    timestamp: Date.now()
  });
}

export function useRuntimeErrorState() {
  return readonly(runtimeErrorState);
}
