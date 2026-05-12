import React from 'react';
import { View, Text } from 'react-native';
import { useSession, useUserRole } from '@/features/auth/store/auth.store';

export default function DashboardScreen() {
  const session = useSession();
  const userRole = useUserRole();

  return (
    <View className="flex-1 bg-background p-6">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-foreground mb-2">
          Bienvenue sur SecuriClick
        </Text>
        <Text className="text-muted-foreground text-center">
          Tableau de bord
        </Text>
      </View>

      <View className="space-y-4">
        <View className="bg-card p-4 rounded-lg">
          <Text className="text-lg font-semibold mb-2">
            Informations utilisateur
          </Text>
          <Text className="text-muted-foreground">
            Email: {session?.user.email}
          </Text>
          <Text className="text-muted-foreground">Rôle: {userRole}</Text>
          {session?.user.profile && (
            <>
              <Text className="text-muted-foreground">
                Nom: {session.user.profile.full_name}
              </Text>
              {session.user.profile.phone && (
                <Text className="text-muted-foreground">
                  Téléphone: {session.user.profile.phone}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}
