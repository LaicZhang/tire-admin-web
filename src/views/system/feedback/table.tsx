import { h, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils";
import { addFeedbackApi, updateFeedbackApi } from "@/api";
import Form from "./form.vue";

export function openDialog(title = "新增", row?) {
  const formRef = ref();
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
      h(Form, { ref: formRef, formInline: options.props.formInline }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline as any;

      FormRef.validate(async valid => {
        if (valid) {
          if (title === "新增") {
            await addFeedbackApi({
              content: curData.content,
              rating: curData.rating,
              status: curData.status,
              type: curData.type
            });
            message(`您${title}了反馈`, { type: "success" });
          } else {
            await updateFeedbackApi(row.uid, {
              content: curData.content,
              rating: curData.rating,
              status: curData.status,
              type: curData.type
            });
            message(`您${title}了反馈`, { type: "success" });
          }
          done();
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      });
    }
  });
}
