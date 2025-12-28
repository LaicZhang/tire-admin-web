import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

type Result = {
  code: number;
  msg: string;
  data: Array<unknown>;
};

export const getAsyncRoutes = async () => {
  return await http.request<Result>("get", baseUrlApi("/auth/async-routes"));
};
