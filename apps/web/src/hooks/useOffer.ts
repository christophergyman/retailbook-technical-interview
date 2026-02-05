import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Offer } from '@trading/shared';

export function useOffer(id: string) {
  return useQuery({
    queryKey: ['offers', id],
    queryFn: () => api.get<Offer>(`/offers/${id}`),
    enabled: !!id,
  });
}
