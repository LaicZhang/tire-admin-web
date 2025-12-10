import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addEmployeeApi, updateEmployeeApi } from "@/api";
import editForm from "./form.vue";
import { getRandomName, getUsernameOfOnlyNumber } from "@/utils";

export interface FormItemProps {
  phone: string;
  email: string;
  username: string;
  password: string;
  name: string;
  status: number;
  id: number;
  uid: string;
  desc?: string;
  nickname?: string;
  jobs: any[];
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

const formRef = ref(null);

export function handleSelectionChange(_val) {
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
        phone: row?.user.phone ?? undefined,
        email: row?.user.email ?? undefined,
        username: row?.user.username ?? getUsernameOfOnlyNumber(),
        status: row?.status ?? undefined,
        password: row?.user.password ?? undefined,
        id: row?.id ?? undefined,
        jobs: row?.jobs ?? []
      }
    },
    width: "40%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
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
          const user = { phone, email, username, password },
            nameInfo = {
              name,
              nickname,
              desc,
              status
            };
          if (title === "新增") {
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
            delete user.password;
            await updateEmployeeApi(uid, {
              user,
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
