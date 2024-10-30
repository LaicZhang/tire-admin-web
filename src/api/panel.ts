import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

type Result = {
  code: number;
  msg: string;
  data: Array<any>;
};

export const getSystemUpdateLogApi = (index: number) => {
  return http.request<Result>(
    "get",
    baseUrlApi("/auth/update-history/page/") + index
  );
};

export const getSysDictApi = () => {
  return http.request<Result>("get", baseUrlApi("/dict/list"));
};
