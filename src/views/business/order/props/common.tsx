import { closeDialog, type ButtonProps } from "@/components/ReDialog";
import {
  delay,
  isArray,
  type RefValue,
  useCopyToClipboard
} from "@pureadmin/utils";
import { computed, ref } from "vue";

const { copied, update } = useCopyToClipboard();

export const copySvg = new URL("../order/copy.svg", location.origin).href;
export const checkSvg = new URL("../order/check.svg", location.origin).href;
export const curCopyActive = ref(null);

export const copyStyle = computed(() => {
  return {
    cursor: "pointer",
    marginLeft: "4px",
    verticalAlign: "sub"
  };
});

export function onCopy(
  value: string | any[] | RefValue<string>,
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

export const getFooterButtons = (type, title = "新增") => {
  let footerButtons: ButtonProps[] = [];
  if (title === "新增") footerButtons = [];
  else
    footerButtons = [
      {
        label: "取消",
        type: "danger",
        btnClick: ({ dialog: { options, index }, button: _button }) => {
          closeDialog(options, index);
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
