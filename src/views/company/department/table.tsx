import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addDepartmentApi, updateDepartmentApi } from "@/api";
import editForm from "./form.vue";

interface FormItemProps {
  uid?: string;
  name: string;
  id?: number;
  desc?: string;
  managers: string[];
  employees: string[];
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
    title: `${title}部门`,
    props: {
      formInline: {
        name: row?.name ?? undefined,
        uid: row?.uid ?? undefined,
        desc: row?.desc ?? undefined,
        managers: row?.managers ?? [],
        employees: row?.employees ?? []
      }
    },
    width: "40%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, { ref: formRef, formInline: options.props.formInline }),
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
          const { uid, name, desc, managers, employees } = curData;
          if (title === "新增") {
            const managerIds = managers.map(m => ({ uid: m }));
            const employeeIds = employees.map(e => ({ uid: e }));
            await addDepartmentApi({
              name,
              desc,
              managers: { connect: managerIds },
              employees: { connect: employeeIds },
              company: {
                connect: { uid: await getCompanyId() }
              }
            });
            chores();
          } else {
            const managerIds = managers.map(m => ({ uid: m }));
            const employeeIds = employees.map(e => ({ uid: e }));
            await updateDepartmentApi(uid, {
              name,
              desc,
              managers: { connect: managerIds },
              employees: { connect: employeeIds }
            });
            chores();
          }
        }
      });
    }
  });
}
