export interface UserInfoType {
  phone: string;
  email: string;
  username: string;
  info: {
    id?: string;
    userId: string;
    avatarId: string;
    nickname?: string;
    isRealName: boolean;
    birthday: string | Date;
    gender: number;
    isCN: boolean;
    updateAt?: string;
  };
}

export const userInfoTemplate: UserInfoType = {
  phone: "",
  email: "",
  username: "",
  info: {
    id: undefined,
    userId: "",
    avatarId: "",
    nickname: undefined,
    isRealName: false,
    birthday: "",
    gender: 1,
    isCN: true,
    updateAt: undefined
  }
};
