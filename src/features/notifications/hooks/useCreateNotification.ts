import { useMutation } from '@tanstack/react-query';
import { insertNotification } from '../api/notifications.api';
import type { NotificationMetadata, NotificationType } from '../types';
import type { UserRole } from '@/features/auth/types';

interface CreateNotificationParams {
  userId: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: NotificationMetadata;
  idempotencyKey?: string;
}

// Used by features to fire a notification for another user (e.g. school notifies parent).
// The idempotencyKey prevents double-inserts on retry.
export function useCreateNotification() {
  return useMutation({
    mutationFn: (params: CreateNotificationParams) =>
      insertNotification({
        userId: params.userId,
        role: params.role,
        type: params.type,
        title: params.title,
        body: params.body,
        metadata: params.metadata,
        idempotencyKey: params.idempotencyKey,
      }),
  });
}
