import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { OrderDetail } from '@trading/shared';

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.get<OrderDetail>(`/orders/${id}`),
    enabled: !!id,
  });
}
