import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Offer } from '@trading/shared';

export function useOffers(filters?: { status?: string; sector?: string }) {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.sector) params.set('sector', filters.sector);
      const query = params.toString();
      return api.get<Offer[]>(`/offers${query ? `?${query}` : ''}`);
    },
  });
}
