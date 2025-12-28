import { h, ref } from "vue";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { updateCompanyInfoApi } from "@/api";
import type { CompanyInfo } from "@/api/type";
import type { UpdateCompanyInfoDto } from "@/api/auth";
import editForm from "./form.vue";

interface FormItemProps extends UpdateCompanyInfoDto {
  id?: number;
  uid?: string;
  bossId?: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref<InstanceType<typeof editForm> | null>(null);

export function handleSelectionChange(_val: unknown): void {
  // 选择变化处理
}

export function openDialog(title = "更新", row?: Partial<CompanyInfo>): void {
  addDialog({
    title: `公司信息${title}`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? "",
        principalName: row?.principalName ?? "",
        principalPhone: row?.principalPhone ?? "",
        province: row?.province ?? "",
        city: row?.city ?? ""
      }
    },
    width: "50%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: formRef,
        formInline: options.props!.formInline as FormItemProps
      }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value?.getRef();
      const curData = options.props!.formInline as FormItemProps;
      function chores() {
        message(`公司信息${title}成功`, {
          type: "success"
        });
        done(); // 关闭弹框
        // 刷新页面
        window.location.reload();
      }
      FormRef?.validate(async (valid: boolean) => {
        if (valid) {
          if (title === "更新") {
            const {
              name,
              desc,
              principalName,
              principalPhone,
              province,
              city
            } = curData;
            await updateCompanyInfoApi({
              name,
              desc,
              principalName,
              principalPhone,
              province,
              city
            });
            chores();
          }
        }
      });
    }
  });
}
