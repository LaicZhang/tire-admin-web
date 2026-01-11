export interface PositionItem {
  id: string | number;
  uid?: string;
  name: string;
  cn?: string;
}

export interface EmployeeFormItem {
  phone: string;
  email: string;
  status: number | string;
  username: string;
  password?: string;
  name: string;
  nickname: string;
  uid?: string;
  id?: string | number;
  desc?: string;
  jobs: Array<string | number>;
}
