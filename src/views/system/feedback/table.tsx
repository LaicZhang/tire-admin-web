import { h, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils";
import { addFeedbackApi, updateFeedbackApi } from "@/api";
import Form from "./form.vue";
import type { FormInstance } from "element-plus";

interface FeedbackRow {
  uid: string;
  content: string;
  rating?: number;
  status: number;
  type: number;
}

type FeedbackFormInline = Partial<FeedbackRow>;

export function openDialog(
  title = "新增",
  row?: FeedbackRow,
  onSuccess?: () => void
) {
  const formRef = ref<{ getRef: () => FormInstance } | null>(null);
  addDialog({
    title: `${title}反馈`,
    props: {
      formInline: row
        ? {
            uid: row.uid,
            content: row.content,
            rating: row.rating,
            status: row.status,
            type: row.type
          }
        : {
            content: "",
            rating: undefined,
            status: 0,
            type: 0
          }
    },
    width: "800px",
    draggable: true,
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(Form, {
        ref: formRef,
        formInline: (options.props as { formInline: FeedbackFormInline })
          .formInline
      }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;
      const curData = (options.props as { formInline: FeedbackFormInline })
        .formInline;

      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          if (title === "新增") {
            await addFeedbackApi({
              content: curData.content ?? "",
              rating: curData.rating,
              status: curData.status,
              type: curData.type
            });
            message(`您${title}了反馈`, { type: "success" });
          } else {
            if (!row?.uid) return;
            await updateFeedbackApi(row.uid, {
              content: curData.content,
              rating: curData.rating,
              status: curData.status,
              type: curData.type
            });
            message(`您${title}了反馈`, { type: "success" });
          }
          done();
          // 调用成功回调刷新数据
          onSuccess?.();
        }
      });
    }
  });
}
