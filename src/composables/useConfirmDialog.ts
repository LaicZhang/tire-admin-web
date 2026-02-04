import { confirmBox } from "@/utils";

function isMessageBoxCancelReason(error: unknown): boolean {
  if (error === "cancel" || error === "close") return true;
  const message = (error as { message?: unknown } | null)?.message;
  if (message === "cancel" || message === "close") return true;
  const asString = String(error);
  return asString === "cancel" || asString === "close";
}

export function useConfirmDialog() {
  const confirm = async (
    content: string,
    title?: string,
    options: Record<string, unknown> = {}
  ): Promise<boolean> => {
    try {
      await confirmBox(content, title, options);
      return true;
    } catch (error) {
      if (isMessageBoxCancelReason(error)) return false;
      throw error;
    }
  };

  const handleConfirmAction = async (
    content: string,
    onConfirm: () => Promise<void> | void,
    config?: {
      title?: string;
      options?: Record<string, unknown>;
    }
  ): Promise<boolean> => {
    const ok = await confirm(content, config?.title, config?.options);
    if (!ok) return false;
    await onConfirm();
    return true;
  };

  return {
    confirm,
    handleConfirmAction
  };
}
