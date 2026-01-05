import { h, ref } from "vue";
import { message } from "../../../utils/message";
import { addDialog } from "../../../components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getCompanyId, addCustomerApi, updateCustomerApi } from "@/api";
import editForm from "./form.vue";
import type { FormInstance } from "element-plus";

interface FormItemProps {
  uid: string;
  name: string;
  id?: number;
  desc?: string;
  operatorId?: string;
  levelId?: number;
  tagIds: number[];
  creditLimit?: number;
  initialBalance?: number;
  totalTransactionAmount?: number;
  isPublic?: boolean;
  province?: string;
  isIndividual?: boolean;
  from?: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };

const formRef = ref<{ getRef: () => FormInstance } | null>(null);

export function handleSelectionChange(_val: unknown) {
  // 选择变化处理
}

interface CustomerRow {
  name?: string;
  uid?: string;
  desc?: string;
  id?: number;
  operator?: { uid: string };
  level?: { id: number };
  tags?: Array<{ id: number }>;
  creditLimit?: number;
  totalTransactionAmount?: number;
  isPublic?: boolean;
  province?: string;
  isIndividual?: boolean;
  from?: string;
}

export function openDialog(title = "新增", row?: CustomerRow) {
  addDialog({
    title: `${title}客户`,
    props: {
      formInline: {
        name: row?.name ?? "",
        uid: row?.uid ?? "",
        desc: row?.desc ?? "",
        id: row?.id,
        operatorId: row?.operator?.uid,
        levelId: row?.level?.id,
        tagIds: row?.tags?.map((t: { id: number }) => t.id) ?? [],
        creditLimit: row?.creditLimit ?? 0,
        initialBalance: 0, // Only logic for new customers
        totalTransactionAmount: row?.totalTransactionAmount ?? 0,
        isPublic: row?.isPublic ?? false,
        province: row?.province ?? "",
        isIndividual: row?.isIndividual ?? false,
        from: row?.from ?? ""
      }
    },
    width: "45%",
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
        message(`您${title}了客户「${curData.name}」`, {
          type: "success"
        });
        done(); // 关闭弹框
        // 刷新列表（需要父组件配合，或者在这里通过其他方式触发刷新，目前保持原有逻辑）
        location.reload(); // Temporary fallback to ensure list refresh if not handled by parent
      }
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const companyId = await getCompanyId();

          // 构建基础数据

          const baseData: Record<string, unknown> = {
            name: curData.name,
            desc: curData.desc,
            from: curData.from,
            isIndividual: curData.isIndividual,
            creditLimit: curData.creditLimit,
            // 关联公司
            company: {
              connect: { uid: companyId }
            }
          };

          // 处理关联关系
          if (curData.levelId) {
            baseData.level = {
              connect: { id: curData.levelId }
            };
          }

          if (curData.tagIds && curData.tagIds.length > 0) {
            baseData.tags = {
              connect: curData.tagIds.map(id => ({ id }))
            };
          }

          if (title === "新增") {
            // 如果有期初欠款，可能需要特殊处理，但这里先尝试作为普通字段（如果后端模型支持）
            // 注意：initialBalance 通常不直接存在于 customer 表，而是作为 debtProfile 或 transaction 存在。
            // 这里仅传递给后端，看后端如何处理。如果不支持会报错。
            if (curData.initialBalance) {
              baseData.initialBalance = curData.initialBalance;
            }

            await addCustomerApi({
              customer: baseData
            });
            chores();
          } else {
            // 更新时，tag 需要先 disconnect 再 connect，或者用 set (Prisma update input)
            // 为了简单，我们使用 set 来替换
            if (curData.tagIds) {
              baseData.tags = {
                set: curData.tagIds.map(id => ({ id }))
              };
            }

            await updateCustomerApi(curData.uid, baseData);
            chores();
          }
        }
      });
    }
  });
}
