import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Character, CreatedPick } from '@yellowpicker/shared';

import { http } from './http';

export const charactersKey = ['characters'] as const;

export function useCharacters() {
  return useQuery({
    queryKey: charactersKey,
    queryFn: () => http<Character[]>('/api/characters'),
    // Rafraîchit régulièrement pour voir les choix des autres invités.
    refetchInterval: 10_000,
  });
}

export interface PickPayload {
  characterId: number;
  firstName: string;
  lastName: string;
  photo: Blob;
}

export function useCreatePick() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ characterId, firstName, lastName, photo }: PickPayload) => {
      const body = new FormData();
      body.set('firstName', firstName);
      body.set('lastName', lastName);
      body.set('photo', photo, 'photo.jpg');
      return http<CreatedPick>(`/api/characters/${characterId}/picks`, { method: 'POST', body });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: charactersKey }),
  });
}

export function useCancelPick() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pickId, editToken }: { pickId: number; editToken: string }) =>
      http<undefined>(`/api/picks/${pickId}`, {
        method: 'DELETE',
        headers: { 'x-edit-token': editToken },
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: charactersKey }),
  });
}
