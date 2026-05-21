import React, { memo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export type FaqRole = 'parent' | 'collector' | 'school';

interface FaqEntry {
  q: string;
  a: string;
}

const FAQ_PARENT: FaqEntry[] = [
  {
    q: 'Comment fonctionne SecuriClick ?',
    a: "SecuriClick génère un QR code temporaire pour chaque récupération. Le personnel de l'établissement le scanne pour valider la sortie de votre enfant. Chaque récupération est tracée et vous êtes notifié en temps réel.",
  },
  {
    q: 'Comment ajouter un collecteur autorisé ?',
    a: "Rendez-vous dans l'onglet Enfants, sélectionnez votre enfant, puis appuyez sur « Ajouter un collecteur ». Renseignez ses informations et un code de connexion à 6 chiffres qu'il utilisera pour se connecter.",
  },
  {
    q: 'Le collecteur reçoit-il automatiquement un accès ?',
    a: "Oui. Un email d'invitation est envoyé à l'adresse que vous saisissez. Il peut ensuite se connecter avec son email et le code PIN que vous lui communiquez.",
  },
  {
    q: 'Comment désactiver temporairement un collecteur ?',
    a: 'Dans la fiche du collecteur (Enfants > votre enfant > collecteur), utilisez le toggle en haut à droite pour activer ou désactiver son accès instantanément.',
  },
  {
    q: 'Mon QR code est-il valable longtemps ?',
    a: 'Non. Chaque QR code est à usage unique et expire après un délai limité pour des raisons de sécurité. Un nouveau code est généré à chaque session.',
  },
  {
    q: 'Que se passe-t-il en cas de refus de récupération ?',
    a: "Vous recevez une notification immédiate avec le motif du refus. L'établissement a bloqué l'accès car le collecteur ou le QR code n'était pas valide.",
  },
  {
    q: 'Comment modifier les informations de mon enfant ?',
    a: "Allez dans l'onglet Enfants, appuyez sur le profil de votre enfant, puis sur l'icône de modification.",
  },
  {
    q: 'Comment contacter le support ?',
    a: 'Envoyez un email à contact@securi-click.com. Nous répondons sous 24 à 48 heures ouvrées.',
  },
];

const FAQ_COLLECTOR: FaqEntry[] = [
  {
    q: 'Comment me connecter en tant que collecteur ?',
    a: "Utilisez l'email et le code PIN à 6 chiffres que le parent vous a communiqués. Ce code est confidentiel — ne le partagez pas.",
  },
  {
    q: 'Que faire si je ne connais pas mon code PIN ?',
    a: 'Contactez directement le parent qui vous a autorisé. Il peut générer un nouveau code depuis son application.',
  },
  {
    q: 'Comment récupérer un enfant ?',
    a: "Présentez le QR code disponible dans l'onglet QR Code au personnel de l'établissement. Ils le scanneront pour valider la sortie.",
  },
  {
    q: 'Mon QR code est refusé — que faire ?',
    a: "Votre accès peut être désactivé ou le QR code expiré. Contactez le parent pour qu'il réactive votre autorisation ou génère un nouveau code.",
  },
  {
    q: 'Pourquoi doit-on vérifier mon identité ?',
    a: "La vérification d'identité permet à l'établissement de confirmer que vous êtes bien la personne autorisée par le parent. Elle est optionnelle mais recommandée pour fluidifier les récupérations.",
  },
  {
    q: "Comment soumettre ma pièce d'identité ?",
    a: "Dans votre profil, appuyez sur « Pièce d'identité » puis suivez les étapes pour prendre une photo de votre document.",
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Toutes les données sont chiffrées et hébergées en Europe. SecuriClick est conforme au RGPD. Vos informations ne sont jamais partagées à des tiers.',
  },
  {
    q: 'Comment contacter le support ?',
    a: 'Envoyez un email à contact@securi-click.com. Nous répondons sous 24 à 48 heures ouvrées.',
  },
];

const FAQ_SCHOOL: FaqEntry[] = [
  {
    q: 'Comment scanner un QR code de récupération ?',
    a: "Rendez-vous dans l'onglet Scanner, autorisez l'accès à la caméra, puis pointez sur le QR code du collecteur. La validation est automatique et instantanée.",
  },
  {
    q: 'Que faire si le scan échoue ou est refusé ?',
    a: "Un message clair s'affiche avec le motif du refus (QR expiré, collecteur désactivé, enfant non inscrit…). Contactez le parent si la situation persiste.",
  },
  {
    q: "Comment voir l'historique des récupérations ?",
    a: "L'onglet Historique affiche toutes les récupérations du jour et des jours précédents. Utilisez les filtres Tous / Validés / Refusés pour affiner.",
  },
  {
    q: 'Comment accéder aux informations de mon établissement ?',
    a: "Dans l'onglet Profil, toutes les informations de l'établissement sont affichées. Appuyez sur « Modifier l'établissement » pour les mettre à jour.",
  },
  {
    q: 'Les notifications sont-elles en temps réel ?',
    a: 'Oui. Toute validation, refus ou incident déclenche une notification immédiate. La cloche en haut du scanner affiche le nombre de non-lues.',
  },
  {
    q: "Comment gérer le logo de l'établissement ?",
    a: "Dans l'onglet Profil, appuyez sur le logo pour le modifier. Vous pouvez prendre une photo ou choisir depuis la galerie.",
  },
  {
    q: "Plusieurs agents peuvent-ils utiliser l'application ?",
    a: 'Actuellement, un seul compte administrateur est lié à un établissement. Si vous avez besoin de plusieurs accès, contactez le support.',
  },
  {
    q: 'Comment contacter le support ?',
    a: 'Envoyez un email à contact@securi-click.com. Nous répondons sous 24 à 48 heures ouvrées.',
  },
];

const FAQ_BY_ROLE: Record<FaqRole, FaqEntry[]> = {
  parent: FAQ_PARENT,
  collector: FAQ_COLLECTOR,
  school: FAQ_SCHOOL,
};

const FaqItem = memo(function FaqItem({
  entry,
  index,
}: {
  entry: FaqEntry;
  index: number;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
        style={{
          backgroundColor: t.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: open ? t.accent : t.cardBorder,
          marginBottom: 10,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              backgroundColor: open ? t.accentBg : t.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: open ? t.accent : t.textMuted,
              }}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: '700',
              color: open ? t.accent : t.text,
              lineHeight: 20,
            }}
          >
            {entry.q}
          </Text>
          {open ? (
            <Ionicons name="chevron-up" size={16} color={t.accent} />
          ) : (
            <Ionicons name="chevron-down" size={16} color={t.textMuted} />
          )}
        </View>
        {open && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              paddingTop: 2,
              borderTopWidth: 1,
              borderTopColor: t.separator,
            }}
          >
            <Text
              style={{ fontSize: 14, color: t.textSecondary, lineHeight: 22 }}
            >
              {entry.a}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

export const FaqScreen = memo(({ role }: { role: FaqRole }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const entries = FAQ_BY_ROLE[role];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {entries.length} questions
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 20,
          lineHeight: 20,
        }}
      >
        Vous ne trouvez pas votre réponse ? Contactez-nous à{' '}
        <Text style={{ color: t.accent, fontWeight: '600' }}>
          contact@securi-click.com
        </Text>
      </Text>

      {entries.map((entry, i) => (
        <FaqItem key={i} entry={entry} index={i} />
      ))}
    </ScrollView>
  );
});

FaqScreen.displayName = 'FaqScreen';
