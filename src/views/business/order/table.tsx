import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addRepoApi, updateRepoApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  uid: string;
  name: string;
  /** 仓库编号 */
  id: string;
  desc: string;
  startAt: string;
  endAt: string;
  address: string;
  status: boolean;
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
    title: `${title}仓库`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? "",
        startAt: row?.startAt ?? "",
        endAt: row?.endAt ?? "",
        address: row?.address ?? "",
        status: row?.status ?? 0
      }
    },
    width: "40%",
    hideFooter: title === "查看" ? true : false,
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline as FormItemProps;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async valid => {
        if (valid) {
          console.log("curData", curData);
          if (title === "新增") {
            const { name, desc, startAt, endAt, address } = curData;
            await addRepoApi({
              name,
              desc,
              startAt,
              endAt,
              address,
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            chores();
          } else {
            const { uid, name, desc, startAt, endAt, address, status } =
              curData;
            await updateRepoApi(uid, {
              name,
              desc,
              startAt,
              endAt,
              address,
              status
            });
            chores();
          }
        }
      });
    }
  });
}
