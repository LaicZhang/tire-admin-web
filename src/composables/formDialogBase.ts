import { addDialog } from "@/composables/useDialogService";
import type { DialogOptions } from "@/composables/useDialogService";
import { isMobileViewport } from "@/utils/viewport";

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
    // 弹窗全屏跟 viewport 断点对齐，避免窄桌面窗不全屏 / 宽平板被 UA 强制全屏
    fullscreen: isMobileViewport(),
    fullscreenIcon: true,
    closeOnClickModal: options.closeOnClickModal ?? false,
    contentRenderer: options.contentRenderer,
    beforeSure: options.beforeSure,
    closeCallBack: options.closeCallBack
  });
}
