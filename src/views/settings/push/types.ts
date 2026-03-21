export interface PushSettingsForm {
  pushDeerEnabled: boolean;
  pushDeerKey: string;
  emailEnabled: boolean;
  emailHost: string;
  emailPort: number;
  emailAuthUser: string;
  emailAuthPass: string;
  smsEnabled: boolean;
  smsAppId: string;
  smsSignName: string;
  smsTemplateId: string;
}

export interface PushTestForm {
  pushDeer: {
    text: string;
    desp: string;
    type: "text" | "markdown" | "image";
  };
  email: {
    email: string;
    title: string;
    text: string;
    type: "text" | "html";
  };
  sms: {
    phone: string;
    code: string;
  };
}
