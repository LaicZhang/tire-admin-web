// 回收站 - 类型定义
export interface RecycleItem {
  uid: string;
  name: string;
  type: string;
  typeName: string;
  deleteTime: string;
  deleteBy: string;
  deleteByName: string;
  expireTime: string;
  daysLeft: number;
}

export interface RecycleQuery {
  type?: string;
  keyword?: string;
}
