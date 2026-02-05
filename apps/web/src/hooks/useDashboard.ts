import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { DashboardStats } from '@trading/shared';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardStats>('/dashboard'),
  });
}
