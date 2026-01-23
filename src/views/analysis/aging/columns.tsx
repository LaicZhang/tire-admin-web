interface ReceivableRow {
  name: string;
  orderNumber: string;
  orderDate: string;
  dueAmount: string | number;
  agingDays: number;
  agingBucket: string;
}

interface PayableRow {
  name: string;
  orderNumber: string;
  orderDate: string;
  dueAmount: string | number;
  agingDays: number;
  agingBucket: string;
}

export const receivableColumns: TableColumnList = [
  {
    label: "客户名称",
    prop: "name"
  },
  {
    label: "关联订单号",
    prop: "orderNumber",
    width: 180
  },
  {
    label: "订单日期",
    prop: "orderDate",
    width: 120
  },
  {
    label: "欠款金额",
    prop: "dueAmount",
    cellRenderer: ({ row }: { row: ReceivableRow }) => {
      const formatAmount = (val: string | number) => {
        const num = Number(val) / 100;
        return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
      };
      return (
        <span class="font-bold text-red-500">
          ¥{formatAmount(row.dueAmount)}
        </span>
      );
    }
  },
  {
    label: "账龄(天)",
    prop: "agingDays",
    width: 100,
    sortable: true
  },
  {
    label: "账龄区间",
    prop: "agingBucket",
    width: 120
  }
];

export const payableColumns: TableColumnList = [
  {
    label: "供应商名称",
    prop: "name"
  },
  {
    label: "关联订单号",
    prop: "orderNumber",
    width: 180
  },
  {
    label: "订单日期",
    prop: "orderDate",
    width: 120
  },
  {
    label: "欠款金额",
    prop: "dueAmount",
    cellRenderer: ({ row }: { row: PayableRow }) => {
      const formatAmount = (val: string | number) => {
        const num = Number(val) / 100;
        return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
      };
      return (
        <span class="font-bold text-green-500">
          ¥{formatAmount(row.dueAmount)}
        </span>
      );
    }
  },
  {
    label: "账龄(天)",
    prop: "agingDays",
    width: 100,
    sortable: true
  },
  {
    label: "账龄区间",
    prop: "agingBucket",
    width: 120
  }
];
