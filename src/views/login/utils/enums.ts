// W47 / QR-C2: re-enable WeChat QR entry (backend QR-C1 DTO closed).
// When WX_OPEN_* is missing, qrCode.vue / API surfaces disabled messaging.
const operates = [
  {
    title: "手机号登录"
  },
  {
    title: "微信扫码登录"
  }
];

const thirdParty = [
  {
    title: "微信登录",
    icon: "wechat"
  },
  {
    title: "支付宝登录",
    icon: "alipay"
  },
  {
    title: "QQ",
    icon: "qq"
  },
  {
    title: "微博",
    icon: "weibo"
  }
];

export { operates, thirdParty };
