import { describe, it } from "vitest";
import { h } from "vue";
import { addDialog, closeDialog, closeAllDialog } from "../index";
import type { DialogOptions, ArgsType } from "../type";

describe("ReDialog", () => {
  describe("addDialog", () => {
    it("should add dialog with correct options", () => {
      const options: DialogOptions = {
        title: "测试对话框",
        width: "500px",
        props: { formInline: { name: "test" } }
      };

      addDialog(options);
    });

    it("should handle dialog with contentRenderer", () => {
      const options: DialogOptions = {
        title: "内容渲染测试",
        contentRenderer: () => h("div", "test content")
      };

      addDialog(options);
    });

    it("should handle dialog with beforeSure callback", () => {
      const options: DialogOptions = {
        title: "确认回调测试",
        beforeSure: (done: Function) => {
          (done as () => void)();
        }
      };

      addDialog(options);
    });
  });

  describe("closeDialog", () => {
    it("should close dialog at specified index", () => {
      closeDialog({} as DialogOptions, 0);
    });

    it("should close dialog with args", () => {
      closeDialog({} as DialogOptions, 0, { command: "cancel" } as ArgsType);
    });
  });

  describe("closeAllDialog", () => {
    it("should close all dialogs", () => {
      closeAllDialog();
    });
  });
});
