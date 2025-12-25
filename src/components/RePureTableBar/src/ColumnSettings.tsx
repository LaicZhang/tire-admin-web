import { ref, unref, nextTick, type ComponentInternalInstance } from "vue";
import { cloneDeep, isBoolean, isFunction, getKeyList } from "@pureadmin/utils";
import Sortable from "sortablejs";
import DragIcon from "@/assets/table-bar/drag.svg?component";
import SettingIcon from "@/assets/table-bar/settings.svg?component";

interface ColumnSettingsProps {
  columns: TableColumnList;
  tableKey: string | number;
  instance: ComponentInternalInstance;
  iconClass: string[];
  rendTippyProps: (content: string) => object;
}

/**
 * 列设置弹出框组件
 */
export function useColumnSettings({
  columns,
  tableKey,
  instance,
  iconClass,
  rendTippyProps
}: ColumnSettingsProps) {
  const checkAll = ref(true);
  const isIndeterminate = ref(false);

  const filterColumns = cloneDeep(columns).filter(
    (column: TableColumnList[number]) =>
      isBoolean(column?.hide)
        ? !column.hide
        : !(isFunction(column?.hide) && column?.hide())
  );

  let checkColumnList = getKeyList(cloneDeep(columns), "label") as string[];
  const checkedColumns = ref(
    getKeyList(cloneDeep(filterColumns), "label") as string[]
  );
  const dynamicColumns = ref(cloneDeep(columns));

  const topClass = [
    "flex",
    "justify-between",
    "pt-[3px]",
    "px-[11px]",
    "border-b-[1px]",
    "border-b-solid",
    "border-[#dcdfe6]",
    "dark:border-[#303030]"
  ];

  function handleCheckAllChange(val: boolean) {
    checkedColumns.value = val ? checkColumnList : [];
    isIndeterminate.value = false;
    dynamicColumns.value.map((column: TableColumnList[number]) =>
      val ? (column.hide = false) : (column.hide = true)
    );
  }

  function handleCheckedColumnsChange(value: string[]) {
    checkedColumns.value = value;
    const checkedCount = value.length;
    checkAll.value = checkedCount === checkColumnList.length;
    isIndeterminate.value =
      checkedCount > 0 && checkedCount < checkColumnList.length;
  }

  function handleCheckColumnListChange(val: boolean, label: string) {
    const column = dynamicColumns.value.find(
      (item: TableColumnList[number]) => item.label === label
    );
    if (column) {
      column.hide = !val;
    }
  }

  async function onReset() {
    checkAll.value = true;
    isIndeterminate.value = false;
    dynamicColumns.value = cloneDeep(columns);
    checkColumnList = [];
    checkColumnList = (await getKeyList(
      cloneDeep(columns),
      "label"
    )) as string[];
    checkedColumns.value = getKeyList(
      cloneDeep(filterColumns),
      "label"
    ) as string[];
  }

  /** 列展示拖拽排序 */
  const rowDrop = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    nextTick(() => {
      const wrapper: HTMLElement = (
        instance?.proxy?.$refs[`GroupRef${unref(tableKey)}`] as {
          $el: HTMLElement;
        }
      ).$el.firstElementChild as HTMLElement;
      Sortable.create(wrapper, {
        animation: 300,
        handle: ".drag-btn",
        onEnd: ({ newIndex, oldIndex, item }) => {
          if (newIndex === undefined || oldIndex === undefined) return;
          const targetThElem = item;
          const wrapperElem = targetThElem.parentNode as HTMLElement;
          const oldColumn = dynamicColumns.value[oldIndex];
          const newColumn = dynamicColumns.value[newIndex];
          if (oldColumn?.fixed || newColumn?.fixed) {
            // 当前列存在fixed属性 则不可拖拽
            const oldThElem = wrapperElem.children[oldIndex] as HTMLElement;
            if (newIndex > oldIndex) {
              wrapperElem.insertBefore(targetThElem, oldThElem);
            } else {
              wrapperElem.insertBefore(
                targetThElem,
                oldThElem ? oldThElem.nextElementSibling : oldThElem
              );
            }
            return;
          }
          const currentRow = dynamicColumns.value.splice(oldIndex, 1)[0];
          dynamicColumns.value.splice(newIndex, 0, currentRow);
        }
      });
    });
  };

  const isFixedColumn = (label: string) => {
    const column = dynamicColumns.value.find(
      (item: TableColumnList[number]) => item.label === label
    );
    return column?.fixed ? true : false;
  };

  const reference = {
    reference: () => (
      <SettingIcon
        class={["w-[16px]", ...iconClass]}
        v-tippy={rendTippyProps("列设置")}
      />
    )
  };

  const renderColumnSettings = () => (
    <el-popover
      v-slots={reference}
      placement="bottom-start"
      popper-style={{ padding: 0 }}
      width="200"
      trigger="click"
    >
      <div class={topClass}>
        <el-checkbox
          class="-mr-1!"
          label="列展示"
          v-model={checkAll.value}
          indeterminate={isIndeterminate.value}
          onChange={(value: boolean) => handleCheckAllChange(value)}
        />
        <el-button type="primary" link onClick={() => onReset()}>
          重置
        </el-button>
      </div>

      <div class="pt-[6px] pl-[11px]">
        <el-scrollbar max-height="36vh">
          <el-checkbox-group
            ref={`GroupRef${unref(tableKey)}`}
            modelValue={checkedColumns.value}
            onChange={(value: string[]) => handleCheckedColumnsChange(value)}
          >
            <el-space direction="vertical" alignment="flex-start" size={0}>
              {checkColumnList.map((item: string, index: number) => {
                return (
                  <div class="flex items-center">
                    <DragIcon
                      class={[
                        "drag-btn w-[16px] mr-2",
                        isFixedColumn(item) ? "cursor-no-drop!" : "cursor-grab!"
                      ]}
                      onMouseenter={(event: { preventDefault: () => void }) =>
                        rowDrop(event)
                      }
                    />
                    <el-checkbox
                      key={index}
                      label={item}
                      value={item}
                      onChange={(value: boolean) =>
                        handleCheckColumnListChange(value, item)
                      }
                    >
                      <span
                        title={item}
                        class="inline-block w-[120px] truncate hover:text-text_color_primary"
                      >
                        {item}
                      </span>
                    </el-checkbox>
                  </div>
                );
              })}
            </el-space>
          </el-checkbox-group>
        </el-scrollbar>
      </div>
    </el-popover>
  );

  return {
    dynamicColumns,
    renderColumnSettings
  };
}
