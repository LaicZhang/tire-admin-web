import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/help-center";

export interface HelpCategorySummary {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  children?: HelpCategorySummary[];
  _count?: {
    articles: number;
  };
}

export interface HelpArticleListItem {
  uid: string;
  title: string;
  slug: string;
  summary?: string | null;
  viewCount?: number;
  likeCount?: number;
  tags?: string[];
  publishedAt?: string | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface HelpArticleDetail extends HelpArticleListItem {
  content: string;
}

export interface HelpFaqItem {
  uid: string;
  question: string;
  answer: string;
  tags?: string[];
  likeCount?: number;
  sortOrder?: number;
  createdAt?: string | null;
}

export interface HelpArticleListResponse {
  items: HelpArticleListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HelpFaqListResponse {
  items: HelpFaqItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HelpSearchResponse {
  articles: Array<{
    uid: string;
    title: string;
    slug: string;
    summary?: string | null;
  }>;
  faqs: Array<{
    uid: string;
    question: string;
    answer: string;
  }>;
}

export function getHelpCategoriesApi(includeInactive = false) {
  return http.request<CommonResult<HelpCategorySummary[]>>(
    "get",
    baseUrlApi(`${prefix}/categories`),
    {
      params: includeInactive ? { includeInactive: true } : undefined
    }
  );
}

export function getHelpArticlesApi(params?: {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: number;
  tag?: string;
}) {
  return http.request<CommonResult<HelpArticleListResponse>>(
    "get",
    baseUrlApi(`${prefix}/articles`),
    { params }
  );
}

export function getHelpArticleDetailApi(slug: string) {
  return http.request<CommonResult<HelpArticleDetail>>(
    "get",
    baseUrlApi(`${prefix}/articles/${slug}`)
  );
}

export function getHelpFaqsApi(params?: {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: number;
  tag?: string;
}) {
  return http.request<CommonResult<HelpFaqListResponse>>(
    "get",
    baseUrlApi(`${prefix}/faqs`),
    { params }
  );
}

export function searchHelpContentApi(params: { q: string; limit?: number }) {
  return http.request<CommonResult<HelpSearchResponse>>(
    "get",
    baseUrlApi(`${prefix}/search`),
    { params }
  );
}
