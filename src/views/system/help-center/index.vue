<script setup lang="ts">
import {
  getHelpArticleDetailApi,
  getHelpArticlesApi,
  getHelpCategoriesApi,
  getHelpFaqsApi,
  searchHelpContentApi
} from "@/api";
import type {
  HelpArticleDetail,
  HelpArticleListItem,
  HelpCategorySummary,
  HelpFaqItem
} from "@/api/help-center";
import { handleApiError, message } from "@/utils";
import { Search } from "@element-plus/icons-vue";
import { computed, onMounted, ref, watch } from "vue";

defineOptions({
  name: "helpCenter"
});

const ARTICLE_PAGE_SIZE = 50;
const FAQ_PAGE_SIZE = 50;
const SEARCH_LIMIT = 10;

const loading = ref(false);
const categories = ref<HelpCategorySummary[]>([]);
const articles = ref<HelpArticleListItem[]>([]);
const faqs = ref<HelpFaqItem[]>([]);
const searchKeyword = ref("");
const activeTab = ref<"article" | "faq">("article");
const activeCategoryId = ref<number | undefined>();
const activeArticleSlug = ref("");
const activeArticle = ref<HelpArticleDetail | null>(null);

const activeCategory = computed(() =>
  categories.value.find(item => item.id === activeCategoryId.value)
);

const filteredFaqs = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return faqs.value;
  return faqs.value.filter(item =>
    [item.question, item.answer]
      .filter(Boolean)
      .some(text => text.toLowerCase().includes(keyword))
  );
});

async function loadCategories() {
  const { data, code, msg } = await getHelpCategoriesApi();
  if (code !== 200) {
    throw new Error(msg || "加载帮助分类失败");
  }

  categories.value = data ?? [];
  if (!activeCategoryId.value && categories.value.length > 0) {
    activeCategoryId.value = categories.value[0].id;
  }
}

async function loadArticles() {
  const keyword = searchKeyword.value.trim();

  if (keyword) {
    const { data, code, msg } = await searchHelpContentApi({
      q: keyword,
      limit: SEARCH_LIMIT
    });
    if (code !== 200) {
      throw new Error(msg || "搜索帮助内容失败");
    }

    articles.value =
      data?.articles.map(item => ({
        uid: item.uid,
        title: item.title,
        slug: item.slug,
        summary: item.summary
      })) ?? [];
    return;
  }

  const { data, code, msg } = await getHelpArticlesApi({
    page: 1,
    limit: ARTICLE_PAGE_SIZE,
    ...(activeCategoryId.value ? { categoryId: activeCategoryId.value } : {})
  });
  if (code !== 200) {
    throw new Error(msg || "加载帮助文章失败");
  }

  articles.value = data?.items ?? [];
}

async function loadFaqs() {
  const keyword = searchKeyword.value.trim();
  const { data, code, msg } = await getHelpFaqsApi({
    page: 1,
    limit: FAQ_PAGE_SIZE,
    ...(activeCategoryId.value ? { categoryId: activeCategoryId.value } : {}),
    ...(keyword ? { q: keyword } : {})
  });
  if (code !== 200) {
    throw new Error(msg || "加载 FAQ 失败");
  }

  faqs.value = data?.items ?? [];
}

async function loadArticleDetail(slug: string) {
  if (!slug) {
    activeArticle.value = null;
    activeArticleSlug.value = "";
    return;
  }

  const { data, code, msg } = await getHelpArticleDetailApi(slug);
  if (code !== 200) {
    throw new Error(msg || "加载文章详情失败");
  }

  activeArticleSlug.value = slug;
  activeArticle.value = data ?? null;
}

async function refreshHelpContent() {
  loading.value = true;
  try {
    await loadCategories();
    await Promise.all([loadArticles(), loadFaqs()]);
  } catch (error) {
    handleApiError(error, "加载帮助中心失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void refreshHelpContent();
}

function handleCategoryChange(categoryId?: number) {
  activeCategoryId.value = categoryId;
}

async function handleSelectArticle(article: HelpArticleListItem) {
  try {
    loading.value = true;
    await loadArticleDetail(article.slug);
  } catch (error) {
    handleApiError(error, "加载文章详情失败");
  } finally {
    loading.value = false;
  }
}

watch(activeCategoryId, async (next, previous) => {
  if (next === previous) return;
  try {
    loading.value = true;
    await Promise.all([loadArticles(), loadFaqs()]);
  } catch (error) {
    handleApiError(error, "切换分类失败");
  } finally {
    loading.value = false;
  }
});

watch(
  articles,
  async nextArticles => {
    if (activeTab.value !== "article") return;
    const currentExists = nextArticles.some(
      item => item.slug === activeArticleSlug.value
    );
    const nextArticle = currentExists
      ? nextArticles.find(item => item.slug === activeArticleSlug.value)
      : nextArticles[0];

    if (!nextArticle) {
      activeArticle.value = null;
      activeArticleSlug.value = "";
      return;
    }

    if (nextArticle.slug !== activeArticleSlug.value) {
      try {
        await loadArticleDetail(nextArticle.slug);
      } catch (error) {
        handleApiError(error, "加载文章详情失败");
      }
    }
  },
  { immediate: true }
);

watch(activeTab, nextTab => {
  if (nextTab === "faq") {
    activeArticle.value = null;
    return;
  }

  const firstArticle = articles.value[0];
  if (!firstArticle) return;
  if (firstArticle.slug === activeArticleSlug.value && activeArticle.value)
    return;
  void handleSelectArticle(firstArticle);
});

onMounted(async () => {
  await refreshHelpContent();
  if (categories.value.length === 0) {
    message("当前没有可用的帮助内容", { type: "warning" });
  }
});
</script>

<template>
  <div v-loading="loading" class="main">
    <el-card shadow="never" class="mb-4">
      <div class="toolbar">
        <div>
          <div class="toolbar__title">帮助中心</div>
          <div class="toolbar__hint">
            当前展示服务端已发布的帮助文章与 FAQ，分类切换会直接拉取最新内容。
          </div>
        </div>
        <el-input
          v-model="searchKeyword"
          clearable
          placeholder="搜索文章标题、摘要或 FAQ"
          class="toolbar__search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>
      </div>
    </el-card>

    <div class="help-layout">
      <el-card shadow="never" class="help-layout__sidebar">
        <template #header>
          <div class="panel-title">分类</div>
        </template>
        <el-scrollbar max-height="560px">
          <div class="category-list">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="category-item"
              :class="{
                'category-item--active': category.id === activeCategoryId
              }"
              @click="handleCategoryChange(category.id)"
            >
              <span>{{ category.name }}</span>
              <span class="category-item__count">
                {{ category._count?.articles ?? 0 }}
              </span>
            </button>
          </div>
        </el-scrollbar>
      </el-card>

      <el-card shadow="never" class="help-layout__content">
        <template #header>
          <div class="panel-title">
            {{ activeCategory?.name || "帮助内容" }}
          </div>
        </template>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="帮助文章" name="article">
            <div class="article-layout">
              <el-scrollbar max-height="560px" class="article-layout__list">
                <div v-if="articles.length === 0" class="empty-copy">
                  当前分类下没有可展示文章
                </div>
                <button
                  v-for="article in articles"
                  :key="article.uid"
                  type="button"
                  class="article-item"
                  :class="{
                    'article-item--active': article.slug === activeArticleSlug
                  }"
                  @click="handleSelectArticle(article)"
                >
                  <div class="article-item__title">{{ article.title }}</div>
                  <div class="article-item__summary">
                    {{ article.summary || "暂无摘要" }}
                  </div>
                </button>
              </el-scrollbar>

              <div class="article-layout__detail">
                <template v-if="activeArticle">
                  <div class="article-detail__title">
                    {{ activeArticle.title }}
                  </div>
                  <div class="article-detail__meta">
                    <span>
                      分类：{{ activeArticle.category?.name || "未分类" }}
                    </span>
                    <span>浏览：{{ activeArticle.viewCount ?? 0 }}</span>
                    <span>点赞：{{ activeArticle.likeCount ?? 0 }}</span>
                  </div>
                  <div
                    v-if="activeArticle.tags?.length"
                    class="article-detail__tags"
                  >
                    <el-tag
                      v-for="tag in activeArticle.tags"
                      :key="tag"
                      size="small"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                  <div class="article-detail__content">
                    {{ activeArticle.content }}
                  </div>
                </template>
                <div v-else class="empty-copy">请选择左侧文章查看详情</div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="FAQ" name="faq">
            <el-scrollbar max-height="560px">
              <div v-if="filteredFaqs.length === 0" class="empty-copy">
                当前分类下没有可展示 FAQ
              </div>
              <el-collapse v-else>
                <el-collapse-item
                  v-for="faq in filteredFaqs"
                  :key="faq.uid"
                  :title="faq.question"
                >
                  <div class="faq-answer">{{ faq.answer }}</div>
                </el-collapse-item>
              </el-collapse>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.toolbar__title {
  font-size: 18px;
  font-weight: 600;
}

.toolbar__hint {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.toolbar__search {
  width: 340px;
}

.help-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
}

.help-layout__sidebar,
.help-layout__content {
  min-height: 640px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.category-item:hover,
.category-item--active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.category-item__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.article-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}

.article-layout__list,
.article-layout__detail {
  min-height: 560px;
}

.article-item {
  display: block;
  width: 100%;
  padding: 14px;
  margin-bottom: 10px;
  text-align: left;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
}

.article-item:hover,
.article-item--active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px rgb(var(--el-color-primary-rgb), 0.15);
}

.article-item__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.article-item__summary {
  margin-top: 8px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.article-detail__title {
  font-size: 20px;
  font-weight: 700;
}

.article-detail__meta {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.article-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.article-detail__content,
.faq-answer {
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

.article-detail__content {
  margin-top: 20px;
}

.empty-copy {
  padding: 48px 16px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@media (width <= 1200px) {
  .help-layout,
  .article-layout {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar__search {
    width: 100%;
  }
}
</style>
