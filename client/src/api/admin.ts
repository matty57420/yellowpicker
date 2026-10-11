import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminSession } from '@yellowpicker/shared';

import { charactersKey } from './characters';
import { ApiError, http } from './http';

const sessionKey = ['admin', 'session'] as const;

/** Session admin courante, ou `null` si non connecté. */
export function useAdminSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      try {
        return await http<AdminSession>('/api/admin/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      http<AdminSession>('/api/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),
    onSuccess: (session) => queryClient.setQueryData(sessionKey, session),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http<undefined>('/api/admin/logout', { method: 'POST' }),
    onSuccess: () => queryClient.setQueryData(sessionKey, null),
  });
}

export interface CharacterPayload {
  id?: number;
  name: string;
  description: string;
  maxSlots: number;
  image: Blob | null;
}

export function useSaveCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, description, maxSlots, image }: CharacterPayload) => {
      const body = new FormData();
      body.set('name', name);
      body.set('description', description);
      body.set('maxSlots', String(maxSlots));
      if (image) {
        body.set('image', image, 'image.jpg');
      }
      if (id === undefined) {
        await http<{ id: number }>('/api/admin/characters', { method: 'POST', body });
      } else {
        await http<undefined>(`/api/admin/characters/${id}`, { method: 'PUT', body });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: charactersKey }),
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      http<undefined>(`/api/admin/characters/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: charactersKey }),
  });
}

export function useDeletePickAsAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pickId: number) =>
      http<undefined>(`/api/admin/picks/${pickId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: charactersKey }),
  });
}
