import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WordFilter } from '@/domain/word';
import { getServices } from '@/application/services';

const WORDS_KEY = 'words';

export function useWords(filter: WordFilter = {}) {
  return useQuery({
    queryKey: [WORDS_KEY, filter],
    queryFn: async () => {
      const { wordService } = await getServices();
      return wordService.list(filter);
    },
  });
}

export function useWordCounts() {
  return useQuery({
    queryKey: [WORDS_KEY, 'counts'],
    queryFn: async () => {
      const { wordService } = await getServices();
      return wordService.countsByDifficulty();
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: [WORDS_KEY, 'categories'],
    queryFn: async () => {
      const { wordService } = await getServices();
      return wordService.categories();
    },
  });
}

export function useSetWordEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const { wordService } = await getServices();
      wordService.setEnabled(id, enabled);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [WORDS_KEY] });
    },
  });
}
