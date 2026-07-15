import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/application/services';

export function useLastTeam() {
  return useQuery({
    queryKey: ['teams', 'last'],
    queryFn: async () => {
      const { teamService } = await getServices();
      return teamService.lastTeam();
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['teams', 'leaderboard'],
    queryFn: async () => {
      const { teamService } = await getServices();
      return teamService.leaderboard();
    },
  });
}

export function useClearLeaderboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { teamService } = await getServices();
      teamService.clearLeaderboard();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
