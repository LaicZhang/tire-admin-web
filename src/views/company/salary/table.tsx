import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "@/composables/useDialogService";
import { deviceDetection } from "@pureadmin/utils";
import {
  addSalaryApi,
  updateSalaryApi,
  confirmSalaryApi,
  type CreateSalaryDto
} from "@/api/company/salary";
import { yuanToFen } from "@/utils/formatMoney";
import editForm, { type FormItemProps } from "./form.vue";
import type { FormInstance } from "element-plus";

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref<{
  formRef?: FormInstance;
  formInline?: { value: FormItemProps };
} | null>(null);

function toFen(yuan: string | number | undefined): number {
  const n = Number(yuan ?? 0);
  if (Number.isNaN(n)) return 0;
  return yuanToFen(n);
}

function buildCreatePayload(cur: FormItemProps): CreateSalaryDto {
  const dateNum = Number(cur.date);
  return {
    employeeId: cur.employeeId,
    date: dateNum,
    total: {
      base: toFen(cur.baseYuan),
      performance: toFen(cur.performanceYuan),
      fulltimeAttendanceAward: toFen(cur.fulltimeAttendanceAwardYuan),
      subsidy: toFen(cur.subsidyYuan),
      other: toFen(cur.otherYuan)
    },
    eSocial: {
      tax: toFen(cur.personalTaxYuan)
    },
    cSocial: {
      pension: toFen(cur.companyPensionYuan)
    },
    desc: cur.desc
  };
}

export function handleSelectionChange(_val: unknown) {
  // 选择变化处理
}

export function openDialog(
  title = "新增",
  row?: FormItemProps & {
    employeeId?: string;
    date?: number;
    payableWages?: string | number;
    actualWages?: string | number;
    confirmedAt?: string | null;
    desc?: string | null;
    uid?: string;
  },
  onDone?: () => void
) {
  const isView = title === "查看";
  addDialog({
    title: `${title}月度工资`,
    props: {
      formInline: {
        uid: row?.uid ?? "",
        employeeId: row?.employeeId ?? "",
        date: row?.date ?? "",
        baseYuan: "0",
        performanceYuan: "0",
        fulltimeAttendanceAwardYuan: "0",
        subsidyYuan: "0",
        otherYuan: "0",
        personalTaxYuan: "0",
        companyPensionYuan: "0",
        desc: row?.desc ?? "",
        confirmedAt: row?.confirmedAt ?? null
      } satisfies FormItemProps,
      readonly: isView
    },
    width: "480px",
    hideFooter: isView,
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline,
        readonly: isView
      }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value?.formRef;
      if (!FormRef) return;
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      function chores() {
        message(`您${title}了员工 ${curData.employeeId} 的月度工资`, {
          type: "success"
        });
        done();
        onDone?.();
      }
      FormRef.validate(async (valid: boolean) => {
        if (!valid) return;
        if (title === "新增") {
          await addSalaryApi(buildCreatePayload(curData));
          chores();
        } else if (title === "修改") {
          const uid = curData.uid;
          if (!uid) return;
          // Draft-only: allow desc update without re-nesting totals this wave
          await updateSalaryApi(uid, { desc: curData.desc });
          chores();
        }
      });
    }
  });
}

export async function confirmRow(
  uid: string,
  onDone?: () => void
): Promise<void> {
  await confirmSalaryApi(uid);
  message("已确认该月度工资（金额锁定）", { type: "success" });
  onDone?.();
}
