import type {
  ArgsType,
  ButtonProps,
  DialogOptions,
  DialogProps,
  EventType
} from "@/components/ReDialog/type";
import {
  addDialog,
  closeAllDialog,
  closeDialog,
  updateDialog
} from "@/components/ReDialog/dialog-service";

export type { ArgsType, ButtonProps, DialogOptions, DialogProps, EventType };
export { addDialog, closeDialog, updateDialog, closeAllDialog };
