import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SheetModal } from '@/shared/ui/molecules/SheetModal';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { Toast } from '@/shared/ui/molecules/Toast';
import {
  usePendingInvites,
  useAcceptInvite,
  type PendingInvite,
} from '../../hooks/useCollector';
import { PinEntrySheet } from './PinEntrySheet';

interface CollectorOnboardSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

type SheetState =
  | { kind: 'loading' }
  | { kind: 'no_invites' }
  | { kind: 'invite_list'; invites: PendingInvite[] }
  | { kind: 'pin_entry'; invite: PendingInvite }
  | { kind: 'success'; childName: string };

type I18nFn = (key: string) => string;

function formatError(raw: string, t: I18nFn): string {
  if (raw === 'invalid_token') return t('onboard_error_invalid_token');
  if (raw === 'pin_locked') return t('onboard_error_pin_locked');
  if (raw === 'access_code_required')
    return t('onboard_error_access_code_required');
  if (raw === 'invalid_access_code')
    return t('onboard_error_invalid_access_code');
  return t('onboard_error_generic');
}

export const CollectorOnboardSheet = memo(function CollectorOnboardSheet({
  visible,
  onDismiss,
}: CollectorOnboardSheetProps) {
  const theme = useTheme();
  const { t: i18n } = useTranslation('collector');
  const insets = useSafeAreaInsets();
  const { data: invites, isLoading: invitesLoading } = usePendingInvites();
  const acceptInvite = useAcceptInvite();
  const [state, setState] = useState<SheetState>({ kind: 'loading' });
  const [pinError, setPinError] = useState<string | null>(null);

  // Derive sheet state from invites query
  useEffect(() => {
    if (!visible) return;
    if (invitesLoading) {
      setState({ kind: 'loading' });
      return;
    }
    if (!invites || invites.length === 0) {
      setState({ kind: 'no_invites' });
      return;
    }
    if (invites.length === 1) {
      const invite = invites[0];
      if (invite.access_code_hash) {
        setState({ kind: 'pin_entry', invite });
      } else {
        setState({ kind: 'invite_list', invites });
      }
    } else {
      setState({ kind: 'invite_list', invites });
    }
  }, [visible, invites, invitesLoading]);

  const handleSelectInvite = useCallback(
    (invite: PendingInvite) => {
      if (invite.access_code_hash) {
        setState({ kind: 'pin_entry', invite });
      } else {
        acceptWithoutPin(invite);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const acceptWithoutPin = useCallback(
    (invite: PendingInvite) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      acceptInvite.mutate(
        { token: invite.invitation_token, accessCode: null },
        {
          onSuccess: () => {
            const childName = invite.child
              ? `${invite.child.first_name} ${invite.child.last_name}`
              : i18n('authorized_for');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show(i18n('onboard_accept_success', { name: childName }), {
              type: 'success',
              duration: 3000,
            });
            setState({ kind: 'success', childName });
          },
          onError: e => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const msg = formatError(e.message, i18n);
            setPinError(msg);
            Toast.show(msg, { type: 'error', duration: 4000 });
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acceptInvite]
  );

  const handlePinSubmit = useCallback(
    (token: string, pin: string) => {
      setPinError(null);
      const invite = state.kind === 'pin_entry' ? state.invite : null;
      if (!invite) return;
      acceptInvite.mutate(
        { token, accessCode: pin },
        {
          onSuccess: () => {
            const childName = invite.child
              ? `${invite.child.first_name} ${invite.child.last_name}`
              : i18n('authorized_for');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show(i18n('onboard_accept_success', { name: childName }), {
              type: 'success',
              duration: 3000,
            });
            setState({ kind: 'success', childName });
          },
          onError: e => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const msg = formatError(e.message, i18n);
            setPinError(msg);
            Toast.show(msg, { type: 'error', duration: 4000 });
          },
        }
      );
    },
    [state, acceptInvite]
  );

  const handleDismiss = useCallback(() => {
    setPinError(null);
    onDismiss();
  }, [onDismiss]);

  const handleSuccessDone = useCallback(() => {
    setPinError(null);
    onDismiss();
  }, [onDismiss]);

  return (
    <SheetModal visible={visible} onRequestClose={handleDismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Close button — always visible for Android */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          <TouchableOpacity
            onPress={handleDismiss}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: theme.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {state.kind === 'loading' && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>
              {i18n('onboard_loading')}
            </Text>
          </View>
        )}

        {state.kind === 'no_invites' && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
              gap: 16,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: theme.accentBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="mail-outline" size={32} color={theme.accent} />
            </View>
            <Text
              style={{
                color: theme.text,
                fontSize: 20,
                fontWeight: '800',
                textAlign: 'center',
              }}
            >
              {i18n('onboard_no_invites')}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 21,
              }}
            >
              {i18n('onboard_no_invites_body')}
            </Text>
            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                marginTop: 8,
                backgroundColor: theme.accent,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 32,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {i18n('onboard_understood')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {state.kind === 'invite_list' && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            style={{ flex: 1 }}
          >
            {/* Handle */}
            <View
              style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.inputBorder,
                }}
              />
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}
              >
                {i18n('onboard_title')}
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 20,
                  fontWeight: '800',
                  letterSpacing: -0.3,
                  marginBottom: 20,
                }}
              >
                {i18n(
                  state.invites.length === 1
                    ? 'onboard_invite_count_one'
                    : 'onboard_invite_count_other',
                  { count: state.invites.length }
                )}
              </Text>

              <View style={{ gap: 10 }}>
                {state.invites.map(invite => {
                  const childName = invite.child
                    ? `${invite.child.first_name} ${invite.child.last_name}`
                    : null;
                  return (
                    <TouchableOpacity
                      key={invite.id}
                      onPress={() => handleSelectInvite(invite)}
                      disabled={acceptInvite.isPending}
                      style={{
                        backgroundColor: theme.card,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        opacity: acceptInvite.isPending ? 0.6 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          backgroundColor: theme.accentBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="person-add-outline"
                          size={20}
                          color={theme.accent}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        {childName ? (
                          <Text
                            style={{
                              color: theme.text,
                              fontWeight: '700',
                              fontSize: 15,
                            }}
                          >
                            {childName}
                          </Text>
                        ) : null}
                        <Text
                          style={{
                            color: theme.textSecondary,
                            fontSize: 13,
                            marginTop: 1,
                          }}
                        >
                          {invite.first_name} {invite.last_name} ·{' '}
                          {invite.relationship}
                        </Text>
                      </View>
                      {invite.access_code_hash ? (
                        <View
                          style={{
                            backgroundColor: theme.amberBg,
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text
                            style={{
                              color: theme.amber,
                              fontSize: 11,
                              fontWeight: '700',
                            }}
                          >
                            {i18n('onboard_pin_required')}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {acceptInvite.isError && (
                <Text
                  style={{
                    color: theme.red,
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 12,
                  }}
                >
                  {formatError(acceptInvite.error.message, i18n)}
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {state.kind === 'pin_entry' && (
          <PinEntrySheet
            invite={state.invite}
            onSubmit={handlePinSubmit}
            onDismiss={handleDismiss}
            isLoading={acceptInvite.isPending}
            error={pinError}
          />
        )}

        {state.kind === 'success' && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
              gap: 16,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 26,
                backgroundColor: theme.greenBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark-circle" size={40} color={theme.green} />
            </View>
            <Text
              style={{
                color: theme.text,
                fontSize: 22,
                fontWeight: '800',
                textAlign: 'center',
              }}
            >
              {i18n('access_confirmed')}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              {i18n('access_confirmed_body', { name: state.childName })}
            </Text>
            <TouchableOpacity
              onPress={handleSuccessDone}
              style={{
                marginTop: 8,
                backgroundColor: theme.accent,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 40,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {i18n('onboard_continue')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SheetModal>
  );
});
