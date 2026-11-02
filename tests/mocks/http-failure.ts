import { createEmptyApiPayload } from "../helpers/universal-fixture";

const failure = async () => ({
  code: 500,
  message: "fixture request failed",
  msg: "fixture request failed",
  data: createEmptyApiPayload(),
  total: 0,
  count: 0,
  success: false
});

export const { http } = {
  http: {
    request: failure,
    get: failure,
    post: failure,
    put: failure,
    patch: failure,
    delete: failure
  }
};
