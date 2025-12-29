import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addRepoApi, updateRepoApi } from "@/api";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

interface FormItemProps {
  uid?: string;
  name: string;
  /** 仓库编号 */
  id?: number;
  desc?: string;
  startAt: Date;
  endAt: Date;
  address: string;
  status: boolean;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref<{ getRef: () => FormInstance } | null>(null);

export function handleSelectionChange(_val: unknown) {
  // 选择变化处理
}

function toDate(value: string | Date | undefined, fallback: Date): Date {
  if (!value) return fallback;
  return value instanceof Date ? value : new Date(value);
}

export function openDialog(title = "新增", row?: FormItemProps) {
  const defaultStartAt = new Date();
  const defaultEndAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  addDialog({
    title: `${title}仓库`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? "",
        startAt: toDate(row?.startAt, defaultStartAt),
        endAt: toDate(row?.endAt, defaultEndAt),
        address: row?.address ?? "",
        status: row?.status ?? true
      }
    },
    width: "40%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      function chores() {
        message(`您${title}了名称为${curData.name}的这条数据`, {
          type: "success"
        });
        done(); // 关闭弹框
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
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
            if (!uid) return;
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
