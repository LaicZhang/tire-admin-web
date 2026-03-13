import { h } from "vue";
import { addDialog } from "@/components/ReDialog";
import { ElOption, ElSelect } from "element-plus";
import { ALL_LIST, localForage, message } from "@/utils";
import { convertPurchasePlanApi, type PurchasePlanRecord } from "@/api";

interface SelectOption {
  id?: number | string;
  uid: string;
  name: string;
}

interface ConvertDialogProps {
  providerId: string;
  auditorId: string;
  repoId: string;
  desc: string;
}

async function loadOptions(key: string) {
  return (await localForage().getItem<SelectOption[]>(key)) ?? [];
}

export async function openPurchasePlanConvertDialog(
  row: Pick<PurchasePlanRecord, "id" | "repo" | "tire" | "count">,
  onSuccess: () => Promise<void> | void
) {
  const [providerList, managerList, repoList] = await Promise.all([
    loadOptions(ALL_LIST.provider),
    loadOptions(ALL_LIST.manager),
    loadOptions(ALL_LIST.repo)
  ]);

  addDialog({
    title: "采购计划转订单",
    width: "560px",
    draggable: true,
    closeOnClickModal: false,
    props: {
      providerId: "",
      auditorId: "",
      repoId: row.repo?.uid ?? "",
      desc: ""
    } satisfies ConvertDialogProps,
    contentRenderer: ({ options }) => {
      const props = options.props as ConvertDialogProps;
      return h("div", { class: "space-y-4" }, [
        h(
          "div",
          { class: "text-sm text-gray-500" },
          `商品：${row.tire?.name ?? "-"}，数量：${row.count}`
        ),
        h("el-form", { labelWidth: "88px" }, [
          h("el-form-item", { label: "供应商" }, [
            h(
              ElSelect,
              {
                modelValue: props.providerId,
                "onUpdate:modelValue": (value: string) => {
                  props.providerId = value;
                },
                placeholder: "请选择供应商",
                filterable: true,
                class: "w-full"
              },
              () =>
                providerList.map(item =>
                  h(ElOption, {
                    key: item.uid,
                    label: item.name,
                    value: item.uid
                  })
                )
            )
          ]),
          h("el-form-item", { label: "审核人" }, [
            h(
              ElSelect,
              {
                modelValue: props.auditorId,
                "onUpdate:modelValue": (value: string) => {
                  props.auditorId = value;
                },
                placeholder: "请选择审核人",
                filterable: true,
                class: "w-full"
              },
              () =>
                managerList.map(item =>
                  h(ElOption, {
                    key: item.uid,
                    label: item.name,
                    value: item.uid
                  })
                )
            )
          ]),
          h("el-form-item", { label: "仓库" }, [
            h(
              ElSelect,
              {
                modelValue: props.repoId,
                "onUpdate:modelValue": (value: string) => {
                  props.repoId = value;
                },
                placeholder: "请选择仓库",
                filterable: true,
                clearable: true,
                class: "w-full"
              },
              () =>
                repoList.map(item =>
                  h(ElOption, {
                    key: item.uid,
                    label: item.name,
                    value: item.uid
                  })
                )
            )
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: props.desc,
              "onUpdate:modelValue": (value: string) => {
                props.desc = value;
              },
              type: "textarea",
              placeholder: "可补充本次转采购订单说明"
            })
          ])
        ])
      ]);
    },
    beforeSure: async (done, { options }) => {
      const current = options.props as ConvertDialogProps;
      if (!current.providerId) {
        message("请选择供应商", { type: "warning" });
        return;
      }
      if (!current.auditorId) {
        message("请选择审核人", { type: "warning" });
        return;
      }

      try {
        await convertPurchasePlanApi(row.id, {
          providerId: current.providerId,
          auditorId: current.auditorId,
          repoId: current.repoId || undefined,
          desc: current.desc.trim() || undefined
        });
        message("采购计划已生成采购订单", { type: "success" });
        done();
        await onSuccess();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "转订单失败";
        message(msg, { type: "error" });
      }
    }
  });
}
