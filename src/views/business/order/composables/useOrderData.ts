import { ref } from "vue";
import {
  getEmployeeListApi,
  getRepoListApi,
  getTireListApi,
  getProviderListApi,
  getAuditorListApi
} from "@/api";
import { ALL_LIST, localForage, message, ORDER_TYPE } from "@/utils";

/**
 * 订单相关数据获取 composable
 * 提取从 order/index.vue 中的数据获取逻辑
 */
export function useOrderData(orderType: ReturnType<typeof ref<string>>) {
  const employeeList = ref<any[]>([]);
  const managerList = ref<any[]>([]);
  const allRepoList = ref<any[]>([]);
  const allTireList = ref<any[]>([]);
  const allCustomerList = ref<any[]>([]);
  const allProviderList = ref<any[]>([]);

  const getAllEmployeeList = async () => {
    const { data, code, msg } = await getEmployeeListApi(0);
    if (code === 200) {
      employeeList.value = data;
      await localForage().setItem(ALL_LIST.employee, data);
    } else {
      message(msg, { type: "error" });
    }
  };

  const getAllRepoList = async () => {
    const { data, code, msg } = await getRepoListApi(0);
    if (code === 200) {
      allRepoList.value = data;
      await localForage().setItem(ALL_LIST.repo, data);
    } else {
      message(msg, { type: "error" });
    }
  };

  const getAllCustomerList = async () => {
    const { data, code, msg } = await getTireListApi(0);
    if (code === 200) {
      allCustomerList.value = data;
      await localForage().setItem(ALL_LIST.customer, data);
    } else {
      message(msg, { type: "error" });
    }
  };

  const getAllProviderList = async () => {
    const { data, code, msg } = await getProviderListApi(0);
    if (code === 200) {
      allProviderList.value = data;
      await localForage().setItem(ALL_LIST.provider, data);
    } else {
      message(msg, { type: "error" });
    }
  };

  const getAllTireList = async () => {
    const { data, code, msg } = await getTireListApi(0);
    if (code === 200) {
      allTireList.value = data;
      await localForage().setItem(ALL_LIST.tire, data);
    } else {
      message(msg, { type: "error" });
    }
  };

  const getManagerList = async () => {
    if (orderType.value === ORDER_TYPE.default) return;
    const { data, code, msg } = await getAuditorListApi(orderType.value);
    if (code === 200) {
      managerList.value = data;
      await localForage().setItem(ALL_LIST.manager, data);
    } else {
      message(msg, { type: "error" });
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      getAllEmployeeList(),
      getAllRepoList(),
      getManagerList(),
      getAllTireList(),
      getAllCustomerList(),
      getAllProviderList()
    ]);
  };

  return {
    employeeList,
    managerList,
    allRepoList,
    allTireList,
    allCustomerList,
    allProviderList,
    getAllEmployeeList,
    getAllRepoList,
    getAllCustomerList,
    getAllProviderList,
    getAllTireList,
    getManagerList,
    loadAllData
  };
}
