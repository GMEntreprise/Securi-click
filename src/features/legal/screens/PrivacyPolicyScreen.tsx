import { useTheme } from '@/theme';
import React, { memo } from 'react';
import { ScrollView, Text, View } from 'react-native';
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

export const PrivacyPolicyScreen = memo(() => {
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
          fontSize: 14,
          color: t.textSecondary,
          lineHeight: 22,
          marginBottom: 24,
        }}
      >
        {`Nous nous engageons à respecter les dispositions de la loi n°78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés, ainsi que le Règlement (UE) 2016/679 du 27 avril 2016 dit « RGPD ».\n\nSite web : https://securi-click.com/`}
      </Text>

      <Section title="Données collectées via formulaires">
        <Body>
          {`Lorsque vous soumettez une question ou une demande de rappel, nous collectons votre prénom, nom, téléphone et adresse e-mail.\n\nLors d'une inscription à notre newsletter, nous collectons votre prénom et e-mail.`}
        </Body>
      </Section>

      <Section title="Google Analytics">
        <Body>
          {`Nous utilisons Google Analytics pour suivre les visiteurs sur ce site. Les données collectées sont traitées anonymement et le « partage de données » est désactivé. Aucun autre service Google n'est combiné avec Google Analytics.`}
        </Body>
      </Section>

      <Section title="Cookies">
        <Body>
          {`La navigation peut provoquer l'installation de cookies sur votre appareil. Ces cookies ne permettent pas d'identifier l'utilisateur mais enregistrent des informations relatives à la navigation pour faciliter votre expérience.\n\nSi vous laissez un commentaire, un cookie d'un an peut être déposé pour mémoriser vos coordonnées.`}
        </Body>
      </Section>

      <Section title="Durée de conservation des données">
        <Body>
          {`Les commentaires et leurs métadonnées sont conservés indéfiniment. Les informations personnelles fournies dans votre profil utilisateur sont conservées tant que votre compte est actif.\n\nTous les utilisateurs peuvent voir, modifier ou supprimer leurs informations personnelles à tout moment.`}
        </Body>
      </Section>

      <Section title="Vos droits">
        <Body>
          {`Vous pouvez demander à recevoir un fichier exporté des données personnelles que nous détenons à votre sujet. Vous pouvez également demander leur effacement, sauf pour les données que nous sommes tenus de conserver à des fins administratives, légales ou de sécurité.`}
        </Body>
      </Section>

      <Section title="Sécurité">
        <Body>
          {`Nous utilisons des protocoles sécurisés (HTTPS) pour la communication et le transfert de données. Nous surveillons nos systèmes pour détecter d'éventuelles vulnérabilités et attaques.\n\nEn cas de violation de données, nous nous engageons à en informer les autorités compétentes et à vous en avertir si vos droits sont menacés.`}
        </Body>
      </Section>

      <Section title="Modifications de cette politique">
        <Body>
          {`Nous nous réservons le droit de modifier cette politique à tout moment. Les changements entrent en vigueur immédiatement après leur publication sur le site.`}
        </Body>
      </Section>

      <Section title="Contact">
        <Body>
          {`SECURI'CLICK — SARL Securi'ClickT\n1 Rue Louis Jourdan, 83000 Toulon\nEmail : contact@securi-click.com`}
        </Body>
      </Section>
    </ScrollView>
  );
});

PrivacyPolicyScreen.displayName = 'PrivacyPolicyScreen';
