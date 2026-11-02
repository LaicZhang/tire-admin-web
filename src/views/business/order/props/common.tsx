import { closeDialog, type ButtonProps } from "@/composables/useDialogService";
import {
  delay,
  isArray,
  type RefValue,
  useCopyToClipboard
} from "@pureadmin/utils";
import { computed, ref } from "vue";

const { copied, update } = useCopyToClipboard();

function resolveAsset(path: string) {
  try {
    return new URL(path, window.location.href).href;
  } catch {
    return new URL(path, "http://localhost/").href;
  }
}

export const copySvg = resolveAsset("../order/copy.svg");
export const checkSvg = resolveAsset("../order/check.svg");
export const curCopyActive = ref<string | number | null>(null);

export const copyStyle = computed(() => {
  return {
    cursor: "pointer",
    marginLeft: "4px",
    verticalAlign: "sub"
  };
});

export function onCopy(
  value: string | string[] | RefValue<string>,
  index: string | number
) {
  if (copied.value) return;
  curCopyActive.value = index;

  isArray(value) ? update(value[0]) : update(value);
  delay(100).then(() => (copied.value = !copied.value));
}

export const copySrc = computed(
  () => (index: string | number) =>
    curCopyActive.value === index && copied.value ? checkSvg : copySvg
);

export const getFooterButtons = (_type: string, title = "新增") => {
  let footerButtons: ButtonProps[] = [];
  if (title === "新增") footerButtons = [];
  else
    footerButtons = [
      {
        label: "取消",
        type: "danger",
        btnClick: ({ dialog: { options, index }, button: _button }) => {
          if (options && typeof index === "number") closeDialog(options, index);
        }
      },
      {
        label: "保存",
        type: "primary",
        btnClick: ({
          dialog: { options: _options, index: _index },
          button: _button
        }) => {
          // closeDialog(options, index);
        }
      }
    ];
  return footerButtons;
};
