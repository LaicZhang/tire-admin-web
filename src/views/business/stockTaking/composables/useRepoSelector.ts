import { ref } from "vue";
import { getRepoListApi, type Repo } from "@/api/company/repo";

export function useRepoSelector() {
  const repoList = ref<Repo[]>([]);
  const currentRepo = ref<string | undefined>(undefined);

  const getRepos = async () => {
    try {
      const { data, code } = await getRepoListApi(1, { limit: 100 });
      if (code === 200) {
        repoList.value = Array.isArray(data) ? data : data.list || [];
        if (repoList.value.length && !currentRepo.value) {
          currentRepo.value = repoList.value[0].uid;
        }
      }
    } catch (error) {
      console.error("获取仓库列表失败", error);
    }
  };

  return {
    repoList,
    currentRepo,
    getRepos
  };
}
