import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

type Result = {
  code: number;
  message: string;
  data: Array<any>;
};

export const getAsyncRoutes = async () => {
  return await http.request<Result>("get", baseUrlApi("/auth/async-routes"));
};
