import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addTireNumberApi, updateTireNumberApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  id: number;
  number: string;
  desc: string;
  tireId: string;
  isLocked: boolean;
  isInRepo: boolean;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref(null);

export function handleSelectionChange(val) {
  console.log("handleSelectionChange", val);
}

export function openDialog(title = "新增", row?: FormItemProps) {
  addDialog({
    title: `${title}胎号`,
    props: {
      formInline: {
        number: row?.number ?? "",
        id: row?.id ?? "",
        desc: row?.desc ?? "",
        tireId: row?.tireId ?? "",
        isLocked: row?.isLocked ?? false,
        isInRepo: row?.isInRepo ?? false
      }
    },
    width: "40%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline as FormItemProps;
      function chores() {
        message(`您${title}了id为${curData.id}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async valid => {
        if (valid) {
          console.log("curData", curData);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, tireId, ...curTireNumberData } = curData;
          if (title === "新增") {
            await addTireNumberApi({
              ...curTireNumberData,
              company: {
                connect: { uid: await getCompanyId() }
              },
              tire: {
                connect: { uid: tireId }
              }
            });
            chores();
          } else {
            await updateTireNumberApi(curTireNumberData.number, {
              ...curTireNumberData,
              company: {
                connect: { uid: await getCompanyId() }
              },
              tire: {
                connect: { uid: tireId }
              }
            });
            chores();
          }
        }
      });
    }
  });
}
