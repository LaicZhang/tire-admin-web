import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addEmployeeApi, updateEmployeeApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  phone: string;
  email: string;
  username: string;
  password: string;
  name: string;
  id: number;
  uid: string;
  desc?: string;
  nickname?: string;
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
    title: `${title}员工`,
    props: {
      formInline: {
        name: row?.name ?? "",
        nickname: row?.nickname ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? undefined,
        phone: row?.phone ?? "",
        email: row?.email ?? "",
        username: row?.username ?? "",
        password: row.password ?? "",
        id: 0
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
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async valid => {
        if (valid) {
          console.log("curData", curData);
          const { uid, name, desc, nickname } = curData;
          if (title === "新增") {
            await addEmployeeApi({
              name,
              desc,
              nickname,
              company: {
                connect: { uid: getCompanyId() }
              }
            });
            chores();
          } else {
            await updateEmployeeApi(uid, { name, desc, nickname });
            chores();
          }
        }
      });
    }
  });
}
