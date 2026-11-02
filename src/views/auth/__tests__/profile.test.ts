import { ElMessageBox } from "element-plus";
import { useUserStore } from "@/store/modules/user";
import { mountSmokeComponent } from "../../../../tests/helpers/component-smoke";
import Profile from "../profile.vue";

const mocks = vi.hoisted(() => ({
  getUserInfoApi: vi.fn(),
  getWxBindStatusApi: vi.fn(),
  getWxQrLoginUrlApi: vi.fn(),
  wxQrBindApi: vi.fn(),
  wxUnbindApi: vi.fn(),
  checkStaticImageApi: vi.fn(),
  updateAvatarApi: vi.fn(),
  uploadStaticImageApi: vi.fn(),
  getFileContentMd5: vi.fn(async () => "hash-1"),
  getImageWH: vi.fn(async () => ({ width: 200, height: 100 })),
  message: vi.fn(),
  confirm: vi.fn(async () => true),
  addDialog: vi.fn(),
  closeAllDialog: vi.fn()
}));

vi.mock("@/api", () => ({ getUserInfoApi: mocks.getUserInfoApi }));
vi.mock("@/api/auth", () => ({
  getWxBindStatusApi: mocks.getWxBindStatusApi,
  getWxQrLoginUrlApi: mocks.getWxQrLoginUrlApi,
  wxQrBindApi: mocks.wxQrBindApi,
  wxUnbindApi: mocks.wxUnbindApi
}));
vi.mock("@/api/static", () => ({
  checkStaticImageApi: mocks.checkStaticImageApi,
  updateAvatarApi: mocks.updateAvatarApi,
  uploadStaticImageApi: mocks.uploadStaticImageApi
}));
vi.mock("@/utils/message", () => ({ message: mocks.message }));
vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm })
}));
vi.mock("@/composables/useDialogService", () => ({
  addDialog: mocks.addDialog,
  closeAllDialog: mocks.closeAllDialog
}));
vi.mock("@/utils", async importOriginal => {
  const original = await importOriginal<typeof import("@/utils")>();
  return {
    ...original,
    getFileContentMd5: mocks.getFileContentMd5,
    getImageWH: mocks.getImageWH
  };
});

const user = {
  phone: "13800000000",
  email: "operator@example.com",
  username: "operator",
  info: {
    userId: "user-1",
    avatarId: "avatar-1",
    nickname: "Operator",
    isRealName: true,
    birthday: "1990-01-02",
    gender: 1,
    isCN: true
  }
};

function stateOf(wrapper: Awaited<ReturnType<typeof mountSmokeComponent>>) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

async function mount() {
  return mountSmokeComponent(
    async () => ({ default: Profile }),
    "auth/profile.vue",
    {
      keepMounted: true,
      allowRenderErrors: true
    }
  );
}

function imageFile(name = "avatar.png", type = "image/png", size = 10) {
  const file = new File(["avatar"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function uploadOptions(file: File) {
  return {
    file,
    onSuccess: vi.fn(),
    onError: vi.fn()
  };
}

describe("profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserInfoApi.mockResolvedValue({ code: 200, data: user, msg: "" });
    mocks.getWxBindStatusApi.mockResolvedValue({
      code: 200,
      data: { isBound: false }
    });
    mocks.getWxQrLoginUrlApi.mockResolvedValue({
      code: 200,
      data: { authUrl: "https://wechat.example/qr", state: "state-1" }
    });
    mocks.wxQrBindApi.mockResolvedValue({ code: 200, msg: "" });
    mocks.wxUnbindApi.mockResolvedValue({ code: 200, msg: "" });
    mocks.checkStaticImageApi.mockResolvedValue({ code: 200, data: null });
    mocks.uploadStaticImageApi.mockResolvedValue({
      code: 200,
      data: { uid: "static-uploaded" }
    });
    mocks.updateAvatarApi.mockResolvedValue({ code: 200, msg: "" });
    mocks.confirm.mockResolvedValue(true);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:avatar");
    vi.spyOn(ElMessageBox, "prompt").mockResolvedValue({ value: "123456" });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders masked user data and restores the stored avatar", async () => {
    const wrapper = await mount();
    const store = useUserStore();
    store.setUid("user-1");
    store.setAvatar("stored-avatar.png");

    expect(wrapper.text()).toContain("已实名");
    expect(wrapper.text()).toContain("1990-01-02");
    expect(stateOf(wrapper).avatarDisplayUrl).toBe("stored-avatar.png");

    wrapper.unmount();
  });

  it("derives avatar URLs in preview, static and empty order", async () => {
    const wrapper = await mount();
    const state = stateOf(wrapper);
    const store = useUserStore();

    state.avatarPreviewUrl = "blob:preview";
    expect(state.avatarDisplayUrl).toBe("blob:preview");
    state.avatarPreviewUrl = "";
    store.setAvatar("");
    state.userInfo.info.avatarId = "static-1";
    expect(state.avatarDisplayUrl).toContain("static-1");
    state.userInfo.info.avatarId = "";
    expect(state.avatarDisplayUrl).toBe("");

    wrapper.unmount();
  });

  it("rejects missing, oversized, non-image and unauthenticated avatar uploads", async () => {
    const wrapper = await mount();
    const state = stateOf(wrapper);
    const store = useUserStore();

    await state.handleAvatarUpload({ file: null });
    expect(mocks.getFileContentMd5).not.toHaveBeenCalled();

    await state.handleAvatarUpload(
      uploadOptions(imageFile("large.png", "image/png", 5 * 1024 * 1024 + 1))
    );
    expect(mocks.message).toHaveBeenCalledWith("头像不能超过 5MB", {
      type: "warning"
    });

    await state.handleAvatarUpload(
      uploadOptions(imageFile("notes.txt", "text/plain"))
    );
    expect(mocks.message).toHaveBeenCalledWith("请上传图片文件", {
      type: "warning"
    });

    store.setUid("");
    await state.handleAvatarUpload(uploadOptions(imageFile()));
    expect(mocks.message).toHaveBeenCalledWith("未获取到用户身份，请重新登录", {
      type: "error"
    });

    wrapper.unmount();
  });

  it("uses a cache hit and persists the selected avatar", async () => {
    mocks.checkStaticImageApi.mockResolvedValueOnce({
      code: 200,
      data: { uid: "cached-1" }
    });
    const wrapper = await mount();
    const state = stateOf(wrapper);
    const store = useUserStore();
    store.setUid("user-1");
    const options = uploadOptions(imageFile());

    await state.handleAvatarUpload(options);

    expect(mocks.uploadStaticImageApi).not.toHaveBeenCalled();
    expect(mocks.updateAvatarApi).toHaveBeenCalledWith("user-1", "cached-1");
    expect(state.userInfo.info.avatarId).toBe("cached-1");
    expect(store.avatar).toBe("blob:avatar");
    expect(options.onSuccess).toHaveBeenCalled();
    expect(mocks.message).toHaveBeenCalledWith("头像更新成功", {
      type: "success"
    });

    wrapper.unmount();
  });

  it("falls back to multipart upload when the cache check fails", async () => {
    mocks.checkStaticImageApi.mockRejectedValueOnce(new Error("cache"));
    const wrapper = await mount();
    const state = stateOf(wrapper);
    useUserStore().setUid("user-1");
    const options = uploadOptions(imageFile("avatar", "image/png"));

    await state.handleAvatarUpload(options);

    const form = mocks.uploadStaticImageApi.mock.calls[0][0] as FormData;
    expect(form.get("ext")).toBe("png");
    expect(form.get("mimetype")).toBe("image/png");
    expect(form.get("width")).toBe("200");
    expect(mocks.updateAvatarApi).toHaveBeenCalledWith(
      "user-1",
      "static-uploaded"
    );
    expect(options.onSuccess).toHaveBeenCalled();

    wrapper.unmount();
  });

  it("reports upload and bind failures without completing", async () => {
    const wrapper = await mount();
    const state = stateOf(wrapper);
    useUserStore().setUid("user-1");

    mocks.uploadStaticImageApi.mockResolvedValueOnce({
      code: 400,
      data: null,
      msg: "upload failed"
    });
    const uploadFailure = uploadOptions(imageFile());
    await state.handleAvatarUpload(uploadFailure);
    expect(mocks.message).toHaveBeenCalledWith("upload failed", {
      type: "error"
    });
    expect(uploadFailure.onSuccess).not.toHaveBeenCalled();

    mocks.updateAvatarApi.mockResolvedValueOnce({
      code: 400,
      msg: "bind failed"
    });
    await state.handleAvatarUpload(uploadOptions(imageFile()));
    expect(mocks.message).toHaveBeenCalledWith("bind failed", {
      type: "error"
    });

    wrapper.unmount();
  });

  it("reports thrown avatar work and finishes loading", async () => {
    const wrapper = await mount();
    const state = stateOf(wrapper);
    useUserStore().setUid("user-1");
    mocks.getFileContentMd5.mockRejectedValueOnce(new Error("hash"));
    const options = uploadOptions(imageFile());

    await state.handleAvatarUpload(options);

    expect(mocks.message).toHaveBeenCalledWith("头像更新失败", {
      type: "error"
    });
    expect(options.onError).toHaveBeenCalled();
    expect(state.avatarUploading).toBe(false);

    wrapper.unmount();
  });

  it("handles birthday values and profile failures", async () => {
    mocks.getUserInfoApi.mockResolvedValueOnce({
      code: 500,
      data: null,
      msg: "profile failed"
    });
    const wrapper = await mount();
    const state = stateOf(wrapper);

    state.userInfo.info.birthday = "";
    expect(state.formattedBirthday).toBe("");
    state.userInfo.info.birthday = "invalid";
    expect(state.formattedBirthday).toBe("");
    state.userInfo.info.birthday = "1992-03-04";
    expect(state.formattedBirthday).toBe("1992-03-04");
    expect(mocks.message).toHaveBeenCalledWith("profile failed", {
      type: "error"
    });

    wrapper.unmount();
  });

  it("maps bind status partial data and tolerates status failures", async () => {
    mocks.getWxBindStatusApi.mockResolvedValue({
      code: 200,
      data: { isBound: true, nickname: "", avatar: "", bindTime: "" }
    });
    const wrapper = await mount();
    const state = stateOf(wrapper);
    expect(state.wxBindStatus).toEqual({
      isBound: true,
      nickname: "",
      avatar: "",
      bindTime: ""
    });

    mocks.getWxBindStatusApi.mockRejectedValueOnce(new Error("status"));
    await expect(state.getWxBindStatus()).resolves.toBeUndefined();

    wrapper.unmount();
  });

  it("checks both successful and incomplete bind polling", async () => {
    const wrapper = await mount();
    const state = stateOf(wrapper);

    await state.checkBindStatus();
    expect(mocks.message).toHaveBeenCalledWith(
      "未检测到绑定，请确认已完成扫码",
      { type: "warning" }
    );

    mocks.getWxBindStatusApi.mockResolvedValueOnce({
      code: 200,
      data: { isBound: true }
    });
    await state.checkBindStatus();
    expect(mocks.message).toHaveBeenCalledWith("绑定成功", { type: "success" });
    expect(mocks.closeAllDialog).toHaveBeenCalled();

    wrapper.unmount();
  });

  it("normalizes prompt values and validates password input", async () => {
    const prompt = vi.spyOn(ElMessageBox, "prompt");
    prompt.mockResolvedValueOnce({ value: " secret " });
    const wrapper = await mount();
    const state = stateOf(wrapper);

    await expect(state.promptCurrentPassword("title", "message")).resolves.toBe(
      "secret"
    );
    const options = prompt.mock.calls[0][2] as any;
    expect(options.inputValidator("12345")).toBe("请输入至少 6 位当前密码");
    expect(options.inputValidator(123456)).toBe("请输入至少 6 位当前密码");
    expect(options.inputValidator("123456")).toBe(true);

    prompt.mockResolvedValueOnce(" string-value ");
    await expect(state.promptCurrentPassword("title", "message")).resolves.toBe(
      "string-value"
    );
    prompt.mockRejectedValueOnce("cancel");
    await expect(
      state.promptCurrentPassword("title", "message")
    ).resolves.toBeNull();

    wrapper.unmount();
  });

  it("opens the bind dialog and invokes its complete callback", async () => {
    vi.spyOn(ElMessageBox, "prompt").mockResolvedValueOnce({ value: "123456" });
    const wrapper = await mount();
    const state = stateOf(wrapper);

    await state.handleBindWx();

    expect(mocks.getWxQrLoginUrlApi).toHaveBeenCalled();
    expect(mocks.addDialog).toHaveBeenCalledWith(
      expect.objectContaining({ title: "绑定微信" })
    );
    const dialog = mocks.addDialog.mock.calls[0][0];
    const vnode = dialog.contentRenderer();
    expect(vnode.props.authUrl).toBe("https://wechat.example/qr");
    expect(vnode.props.state).toBe("state-1");
    expect(vnode.props.currentPassword).toBe("123456");

    await vnode.props.onComplete({
      code: "code-1",
      state: "state-1",
      currentPassword: "123456"
    });
    expect(mocks.wxQrBindApi).toHaveBeenCalled();
    expect(mocks.closeAllDialog).toHaveBeenCalled();
    expect(mocks.message).toHaveBeenCalledWith("绑定成功", { type: "success" });

    mocks.wxQrBindApi.mockResolvedValueOnce({
      code: 400,
      msg: "bind rejected"
    });
    await vnode.props.onComplete({ code: "code-2" });
    expect(mocks.message).toHaveBeenCalledWith("bind rejected", {
      type: "error"
    });

    mocks.wxQrBindApi.mockRejectedValueOnce(new Error("bind"));
    await vnode.props.onComplete({ code: "code-3" });
    expect(mocks.message).toHaveBeenCalledWith("绑定失败", { type: "error" });

    vnode.props.onClose();
    await vnode.props.onCheck();
    expect(mocks.closeAllDialog).toHaveBeenCalled();

    wrapper.unmount();
  });

  it("supports fallback QR URLs and reports bind setup failures", async () => {
    vi.spyOn(ElMessageBox, "prompt").mockResolvedValueOnce({ value: "123456" });
    mocks.getWxQrLoginUrlApi.mockResolvedValueOnce({
      code: 200,
      data: { url: "https://fallback.example/qr", state: "state-2" }
    });
    const wrapper = await mount();
    const state = stateOf(wrapper);

    await state.handleBindWx();
    const vnode = mocks.addDialog.mock.calls[0][0].contentRenderer();
    expect(vnode.props.authUrl).toBe("https://fallback.example/qr");

    mocks.getWxQrLoginUrlApi.mockResolvedValueOnce({
      code: 500,
      data: {},
      msg: "qr failed"
    });
    await state.handleBindWx();
    expect(mocks.message).toHaveBeenCalledWith("qr failed", { type: "error" });

    mocks.getWxQrLoginUrlApi.mockRejectedValueOnce(new Error("qr"));
    await state.handleBindWx();
    expect(mocks.message).toHaveBeenCalledWith("获取二维码失败", {
      type: "error"
    });
    expect(state.wxLoading).toBe(false);

    wrapper.unmount();
  });

  it("unbinds after confirmation and password verification", async () => {
    mocks.getWxBindStatusApi.mockResolvedValue({
      code: 200,
      data: { isBound: true, nickname: "WeChat", bindTime: "2026-01-01" }
    });
    const wrapper = await mount();
    const state = stateOf(wrapper);
    expect(state.wxBindStatus.isBound).toBe(true);
    expect(wrapper.text()).toContain("已绑定");
    vi.spyOn(ElMessageBox, "prompt").mockResolvedValueOnce({ value: "123456" });

    await state.handleUnbindWx();

    expect(mocks.confirm).toHaveBeenCalled();
    expect(mocks.wxUnbindApi).toHaveBeenCalledWith({
      currentPassword: "123456"
    });
    expect(state.wxBindStatus.isBound).toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("解绑成功", { type: "success" });

    wrapper.unmount();
  });

  it("covers unbind cancellation, password failure, API rejection and errors", async () => {
    const wrapper = await mount();
    const state = stateOf(wrapper);

    mocks.confirm.mockResolvedValueOnce(false);
    await state.handleUnbindWx();
    expect(mocks.wxUnbindApi).not.toHaveBeenCalled();

    vi.spyOn(ElMessageBox, "prompt").mockRejectedValueOnce("cancel");
    await state.handleUnbindWx();
    expect(mocks.wxUnbindApi).not.toHaveBeenCalled();

    vi.spyOn(ElMessageBox, "prompt").mockResolvedValueOnce({ value: "123456" });
    mocks.wxUnbindApi.mockResolvedValueOnce({
      code: 500,
      msg: "unbind failed"
    });
    await state.handleUnbindWx();
    expect(mocks.message).toHaveBeenCalledWith("unbind failed", {
      type: "error"
    });

    mocks.wxUnbindApi.mockRejectedValueOnce(new Error("unbind"));
    await expect(state.handleUnbindWx()).resolves.toBeUndefined();
    expect(state.wxLoading).toBe(false);

    wrapper.unmount();
  });

  it("opens profile and password dialogs with callbacks", async () => {
    const wrapper = await mount();
    const state = stateOf(wrapper);

    state.openEditDialog();
    const editDialog = mocks.addDialog.mock.calls[0][0];
    const editVNode = editDialog.contentRenderer();
    expect(editVNode.props.initialData).toEqual({
      nickname: "Operator",
      phone: "13800000000",
      email: "operator@example.com",
      gender: 1,
      birthday: "1990-01-02"
    });
    await editVNode.props.onSuccess();
    editVNode.props.onClose();
    expect(mocks.getUserInfoApi).toHaveBeenCalledTimes(2);

    state.openResetPasswordDialog();
    const resetDialog = mocks.addDialog.mock.calls[1][0];
    const resetVNode = resetDialog.contentRenderer();
    resetVNode.props.onSuccess();
    resetVNode.props.onClose();
    expect(mocks.closeAllDialog).toHaveBeenCalledTimes(4);

    wrapper.unmount();
  });
});
