import { deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/components/ReDialog";
import type { DialogOptions } from "@/components/ReDialog";

type ManagedFormDialogOptions = DialogOptions & {
  title: NonNullable<DialogOptions["title"]>;
};

export function openManagedFormDialog(options: ManagedFormDialogOptions) {
  addDialog({
    title: options.title,
    width: options.width ?? "90%",
    showClose: options.showClose,
    hideFooter: options.hideFooter,
    class: options.class,
    beforeClose: options.beforeClose,
    props: options.props,
    footerButtons: options.footerButtons,
    footerRenderer: options.footerRenderer,
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: options.closeOnClickModal ?? false,
    contentRenderer: options.contentRenderer,
    beforeSure: options.beforeSure,
    closeCallBack: options.closeCallBack
  });
}
