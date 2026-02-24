import { ref } from "vue";
import { message } from "@/utils";

type Testing = Record<string, boolean>;

interface TestHandlerOptions {
  /** Return an error message string if validation fails, or null if ok */
  validate: () => string | null;
  /** The API call to invoke */
  testApi: () => Promise<{ code: number }>;
  /** Key in the testing ref to toggle */
  loadingKey: string;
  /** Message on success */
  successMsg: string;
  /** Message on failure */
  failMsg: string;
}

export function usePushTest() {
  const testing = ref<Testing>({
    pushDeer: false,
    email: false,
    sms: false
  });

  const createTestHandler = (options: TestHandlerOptions) => async () => {
    const error = options.validate();
    if (error) {
      message(error, { type: "warning" });
      return;
    }

    testing.value[options.loadingKey] = true;
    try {
      const { code } = await options.testApi();
      if (code === 200) {
        message(options.successMsg, { type: "success" });
      } else {
        message(options.failMsg, { type: "error" });
      }
    } catch {
      message(options.failMsg, { type: "error" });
    } finally {
      testing.value[options.loadingKey] = false;
    }
  };

  return { testing, createTestHandler };
}
