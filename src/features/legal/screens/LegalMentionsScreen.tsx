import { useTheme } from '@/theme';
import React, { memo } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Section = memo(
  ({ title, children }: { title: string; children: React.ReactNode }) => {
    const t = useTheme();
    return (
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: t.text,
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        {children}
      </View>
    );
  }
);

const Body = memo(({ children }: { children: string }) => {
  const t = useTheme();
  return (
    <Text
      style={{
        fontSize: 14,
        color: t.textSecondary,
        lineHeight: 22,
      }}
    >
      {children}
    </Text>
  );
});

export const LegalMentionsScreen = memo(() => {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 20,
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
          marginBottom: 20,
        }}
      >
        Version 1 — Novembre 2024
      </Text>

      <Section title="1. Présentation du site">
        <Body>
          {`En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, voici les informations relatives aux intervenants du site https://securi-click.com/ :\n\nResponsable de publication : SARL Securi'ClickT\nHébergeur : o2Switch — https://www.o2switch.fr/\n\nSECURI'CLICK\nSARL Securi'ClickT\n1 Rue Louis Jourdan\n83000 Toulon`}
        </Body>
      </Section>

      <Section title="Développeur de l'application">
        <View style={{ gap: 6 }}>
          <Body>{`L'application mobile SecuriClick a été développée par Shavod.`}</Body>
          <Pressable onPress={() => Linking.openURL('https://shavod.com')}>
            {({ pressed }) => (
              <Text
                style={{
                  fontSize: 14,
                  color: '#f97316',
                  fontWeight: '600',
                  opacity: pressed ? 0.6 : 1,
                  textDecorationLine: 'underline',
                }}
              >
                shavod.com
              </Text>
            )}
          </Pressable>
        </View>
      </Section>

      <Section title="2. Conditions générales d'utilisation">
        <Body>
          {`L'utilisation du site https://securi-click.com/ implique l'acceptation pleine et entière des présentes conditions d'utilisation.\n\nCes conditions sont susceptibles d'être modifiées à tout moment. Le site est normalement accessible à tout moment, sauf interruption pour maintenance technique décidée par SARL Securi'ClickT.`}
        </Body>
      </Section>

      <Section title="3. Description des services fournis">
        <Body>
          {`Le site https://securi-click.com/ a pour objet de fournir une information concernant l'ensemble des activités exercées par SARL Securi'ClickT.\n\nSARL Securi'ClickT s'efforce de fournir des informations aussi précises que possible. Toutefois, elle ne pourra être tenue responsable des omissions, inexactitudes et carences dans la mise à jour.`}
        </Body>
      </Section>

      <Section title="4. Limitations contractuelles sur les données techniques">
        <Body>
          {`Nous recommandons d'utiliser les navigateurs dans leur dernière version. Ni le propriétaire ni le créateur du site ne sauraient être responsables de l'implantation de virus ou autres logiciels malveillants liés à une utilisation non sécurisée du site.`}
        </Body>
      </Section>

      <Section title="5. Propriété intellectuelle et reproduction">
        <Body>
          {`Le site constitue une œuvre dont SARL Securi'Click est l'auteur au sens des articles L111.1 et suivants du Code de la propriété intellectuelle. SARL Securi'ClickT est propriétaire des droits de propriété intellectuelle ou détient les droits d'usage sur tous les éléments accessibles sur le site.\n\nToute reproduction ou représentation sans accord préalable est interdite et constitue un acte de contrefaçon.`}
        </Body>
      </Section>

      <Section title="6. Limitations de responsabilité">
        <Body>
          {`SARL Securi'ClickT ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l'utilisateur lors de l'accès au site.\n\nDes espaces interactifs sont à disposition des utilisateurs. SARL Securi'ClickT se réserve le droit de supprimer tout contenu qui contreviendrait à la législation applicable en France.`}
        </Body>
      </Section>

      <Section title="7. Données personnelles">
        <Body>
          {
            "Aucune information personnelle n'est collectée à votre insu ni cédée à des tiers."
          }
        </Body>
      </Section>

      <Section title="8. Droit applicable et attribution de juridiction">
        <Body>
          {
            "Tout litige en relation avec l'utilisation du site https://securi-click.com/ est soumis au droit français. Attribution exclusive de juridiction aux tribunaux compétents de Toulon."
          }
        </Body>
      </Section>

      <Section title="9. Lois et règlements concernés">
        <Body>
          {
            "Loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés, modifiée par la loi n° 2004-801 du 6 août 2004 et par le Règlement européen (UE) 2016/679 du 27 avril 2016 dit « RGPD ». Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique."
          }
        </Body>
      </Section>

      <Section title="Contact">
        <Body>{'contact@securi-click.com'}</Body>
      </Section>
    </ScrollView>
  );
});

LegalMentionsScreen.displayName = 'LegalMentionsScreen';
