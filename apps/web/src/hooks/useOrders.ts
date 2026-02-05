import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Order } from '@trading/shared';

export function useOrders(stage?: string) {
  return useQuery({
    queryKey: ['orders', { stage }],
    queryFn: () => {
      const query = stage ? `?stage=${stage}` : '';
      return api.get<Order[]>(`/orders${query}`);
    },
  });
}
