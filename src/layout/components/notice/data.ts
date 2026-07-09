import type { AuthNoticeItem } from "@/api";

export interface ListItem {
  uid: string;
  avatar: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  status?: "primary" | "success" | "warning" | "info" | "danger";
  extra?: string;
  level: number;
  levelLabel: string;
}

export interface TabItem {
  key: string;
  name: string;
  list: ListItem[];
}

interface NoticeLevelMeta {
  label: string;
  status: NonNullable<ListItem["status"]>;
}

const DEFAULT_NOTICE_DESCRIPTION = "请进入系统查看公告详情";

function trimText(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

export function getNoticeLevelMeta(level: number): NoticeLevelMeta {
  if (level >= 3) {
    return { label: "紧急", status: "danger" };
  }
  if (level === 2) {
    return { label: "重要", status: "warning" };
  }
  if (level === 1) {
    return { label: "提醒", status: "primary" };
  }
  return { label: "通知", status: "info" };
}

export function normalizeNoticeItem(item: AuthNoticeItem): ListItem {
  const levelMeta = getNoticeLevelMeta(item.level);
  const content = trimText(item.content);

  return {
    uid: item.uid,
    avatar: "",
    title: trimText(item.title) || "未命名公告",
    datetime: "系统公告",
    type: "notice",
    description: content || DEFAULT_NOTICE_DESCRIPTION,
    status: levelMeta.status,
    extra: levelMeta.label,
    level: item.level,
    levelLabel: levelMeta.label
  };
}

export function normalizeNoticeList(items: AuthNoticeItem[] = []): ListItem[] {
  return items.map(normalizeNoticeItem);
}

export function createNoticeTabs(items: AuthNoticeItem[] = []): TabItem[] {
  return [
    {
      key: "notice",
      name: "通知",
      list: normalizeNoticeList(items)
    }
  ];
}
