export interface AssetItem {
  uid: string;
  name: string;
  type: number;
  count: number;
  unit: string;
  initValue: { value: number };
  currentValue: { value: number };
  monthlyDepreciation: { value: number };
  status: boolean;
  isAuto: boolean;
  desc?: string;
  createdAt?: string;
  deleteAt?: string;
}

export interface AssetFormItem {
  uid?: string;
  title?: string;
  name: string;
  type: number;
  count: number;
  unit: string;
  initValue: number;
  currentValue: number;
  monthlyDepreciation: number;
  status: boolean;
  isAuto: boolean;
  desc?: string;
}
