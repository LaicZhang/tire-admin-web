import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addEmployeeApi, updateEmployeeApi } from "@/api";
import editForm from "./form.vue";
import { getRandomName, getUsernameOfOnlyNumber } from "@/utils";
import type { FormInstance } from "element-plus";
import type { EmployeeNameDto, EmployeeUserDto } from "@/api/company/employee";

export interface FormItemProps {
  phone?: string;
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  status?: number;
  id?: number;
  uid?: string;
  desc?: string;
  nickname?: string;
  jobs: Array<string | number>;
  user?: {
    username: string;
    password?: string;
    phone: string;
    email: string;
  };
}
export interface FormProps {
  formInline: FormItemProps;
}

const formRef = ref<{ getRef: () => FormInstance } | null>(null);

export function handleSelectionChange(_val: unknown) {
  // 选择变化处理
}

export function openDialog(title = "新增", row?: FormItemProps) {
  addDialog({
    title: `${title}员工`,
    props: {
      formInline: {
        name: row?.name ?? undefined,
        nickname: row?.nickname ?? getRandomName(),
        uid: row?.uid ?? undefined,
        desc: row?.desc ?? undefined,
        phone: row?.user?.phone ?? undefined,
        email: row?.user?.email ?? undefined,
        username: row?.user?.username ?? getUsernameOfOnlyNumber(),
        status: row?.status ?? undefined,
        password: row?.user?.password ?? undefined,
        id: row?.id ?? undefined,
        jobs: row?.jobs?.map((j: any) => j?.uid ?? j?.id ?? j) ?? []
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
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;
      const curData = options.props.formInline as FormItemProps;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const {
            uid,
            name,
            phone,
            email,
            password,
            username,
            desc,
            nickname,
            jobs,
            status
          } = curData;
          if (title === "新增") {
            if (!username || !name) {
              message("请完善用户名和姓名", { type: "error" });
              return;
            }
            const user: EmployeeUserDto = { phone, email, username, password };
            const nameInfo: EmployeeNameDto = { name, nickname, desc, status };
            await addEmployeeApi({
              user,
              connectEmployeeDto: {
                jobs,
                companyId: getCompanyId()
              },
              name: nameInfo
            });
            chores();
          } else {
            if (!uid) {
              message("缺少员工UID", { type: "error" });
              return;
            }
            const userWithoutPassword: Partial<EmployeeUserDto> = {
              phone,
              email,
              username
            };
            const nameInfo: Partial<EmployeeNameDto> = {
              name,
              nickname,
              desc,
              status
            };
            await updateEmployeeApi(uid, {
              user: userWithoutPassword,
              name: nameInfo,
              jobs
            });
            chores();
          }
        }
      });
    }
  });
}
