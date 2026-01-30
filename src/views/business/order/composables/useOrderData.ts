import { ref, type Ref } from "vue";
import {
  getAllEmployeeApi,
  getRepoListApi,
  getTireListApi,
  getProviderListApi,
  getAuditorListApi,
  getCustomerListApi
} from "@/api";
import type { Employee } from "@/api/company/employee";
import type { Repo } from "@/api/company/repo";
import type { Tire } from "@/api/business/tire";
import type { Customer } from "@/api/business/customer";
import type { Provider } from "@/api/business/provider";
import { ALL_LIST, localForage, message, ORDER_TYPE } from "@/utils";

/**
 * 订单相关数据获取 composable
 * 提取从 order/index.vue 中的数据获取逻辑
 */
export function useOrderData(orderType: Ref<string>) {
  const employeeList = ref<Employee[]>([]);
  const managerList = ref<Employee[]>([]);
  const allRepoList = ref<Repo[]>([]);
  const allTireList = ref<Tire[]>([]);
  const allCustomerList = ref<Customer[]>([]);
  const allProviderList = ref<Provider[]>([]);

  const LIST_CACHE_MINUTES = 30;

  const getAllEmployeeList = async () => {
    const res = await getAllEmployeeApi();
    if (res.code !== 200) return message(res.msg, { type: "error" });
    employeeList.value = res.data || [];
    await localForage().setItem(
      ALL_LIST.employee,
      employeeList.value,
      LIST_CACHE_MINUTES
    );
  };

  const getAllRepoList = async () => {
    const res = await getRepoListApi(0);
    if (res.code !== 200) return message(res.msg, { type: "error" });
    allRepoList.value = res.data.list;
    await localForage().setItem(
      ALL_LIST.repo,
      res.data.list,
      LIST_CACHE_MINUTES
    );
  };

  const getAllCustomerList = async () => {
    const res = await getCustomerListApi(0);
    if (res.code !== 200) return message(res.msg, { type: "error" });
    allCustomerList.value = res.data.list;
    await localForage().setItem(
      ALL_LIST.customer,
      res.data.list,
      LIST_CACHE_MINUTES
    );
  };

  const getAllProviderList = async () => {
    const res = await getProviderListApi(0);
    if (res.code !== 200) return message(res.msg, { type: "error" });
    allProviderList.value = res.data.list;
    await localForage().setItem(
      ALL_LIST.provider,
      res.data.list,
      LIST_CACHE_MINUTES
    );
  };

  const getAllTireList = async () => {
    const res = await getTireListApi(0);
    if (res.code !== 200) return message(res.msg, { type: "error" });
    allTireList.value = res.data.list;
    await localForage().setItem(
      ALL_LIST.tire,
      res.data.list,
      LIST_CACHE_MINUTES
    );
  };

  const getManagerList = async () => {
    if (orderType.value === ORDER_TYPE.default) return;
    const res = await getAuditorListApi(orderType.value);
    if (res.code !== 200) return message(res.msg, { type: "error" });
    managerList.value = (res.data || []) as Employee[];
    await localForage().setItem(
      ALL_LIST.manager,
      managerList.value,
      LIST_CACHE_MINUTES
    );
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
