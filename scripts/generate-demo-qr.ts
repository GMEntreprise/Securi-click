import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import {
  DEMO_QR_SCENARIOS,
  DEMO_QR_SITE,
} from '../src/features/demo/domain/qrScenarios';

const OUT = join(process.cwd(), 'docs/salon/qr');
const DOWNLOAD_URL = `${DEMO_QR_SITE}#telecharger`;
const PER_PAGE = 5;

const A4: [number, number] = [595.28, 841.89];
const MM = 72 / 25.4;
const NAVY = rgb(0.118, 0.227, 0.541);
const MUTED = rgb(0.42, 0.45, 0.5);
const GREEN = rgb(0.06, 0.6, 0.42);
const RED = rgb(0.86, 0.2, 0.2);

const SCENARIO_TEXT: Record<
  string,
  { title: string; outcome: string; detail: string }
> = {
  'authorized-grandmother': {
    title: 'Emma Martin · Sophie Martin (grand-mère)',
    outcome: 'VALIDÉ — Collecteur autorisé',
    detail: 'Cette personne dispose d’une autorisation valide.',
  },
  'authorized-father': {
    title: 'Lucas Martin · Thomas Martin (père)',
    outcome: 'VALIDÉ — Récupération autorisée',
    detail: 'Les autorisations sont liées à un enfant précis.',
  },
  'temporary-nanny': {
    title: 'Emma Martin · Julie Bernard (nounou)',
    outcome: 'VALIDÉ — Autorisation temporaire active',
    detail: 'Autorisation limitée dans le temps.',
  },
  'unauthorized-person': {
    title: 'Lucas Martin · Alex Durand',
    outcome: 'REFUSÉ — Collecteur non autorisé',
    detail: 'Cette personne n’a pas d’autorisation pour cet enfant.',
  },
  'expired-code': {
    title: 'Emma Martin · QR code expiré',
    outcome: 'REFUSÉ — QR code expiré',
    detail: 'Ce code n’est plus valable. Demandez un nouveau QR code.',
  },
  'parent-ines': {
    title: 'Inès Moreau · Paul Moreau (parent)',
    outcome: 'VALIDÉ — Récupération par le parent',
    detail: 'Le parent récupère lui-même son enfant.',
  },
  'parent-lea': {
    title: 'Léa Petit · Marie Petit (parent)',
    outcome: 'VALIDÉ — Récupération par le parent',
    detail: 'Le parent récupère lui-même son enfant.',
  },
  'revoked-access': {
    title: 'Lucas Martin · Sophie Martin (grand-mère)',
    outcome: 'REFUSÉ — Autorisation révoquée',
    detail: 'Le parent a retiré l’accès de cette personne pour Lucas.',
  },
  'wrong-child': {
    title: 'Noé Petit · Thomas Martin',
    outcome: 'REFUSÉ — Pas autorisé pour cet enfant',
    detail: 'Thomas est autorisé pour Lucas, pas pour Noé.',
  },
  'already-used': {
    title: 'Emma Martin · Julie Bernard (nounou)',
    outcome: 'REFUSÉ — QR code déjà utilisé',
    detail: 'Chaque QR code ne sert qu’une seule fois.',
  },
};

const STANDS = [
  {
    id: 'chevalet-etablissement',
    url: DOWNLOAD_URL,
    title: 'Découvrez Sécuri’Click côté Établissement',
    subtitle: [
      'Téléchargez l’application, puis touchez',
      '« Essayer sans compte », puis Établissement.',
    ],
  },
  {
    id: 'chevalet-parent',
    url: DOWNLOAD_URL,
    title: 'Découvrez Sécuri’Click côté Parent',
    subtitle: [
      'Téléchargez l’application, puis touchez',
      '« Essayer sans compte », puis Parent.',
    ],
  },
];

const QR_OPTIONS = { errorCorrectionLevel: 'Q' as const, margin: 4 };

async function writeQrFiles(
  name: string,
  content: string
): Promise<Uint8Array> {
  const svg = await QRCode.toString(content, { ...QR_OPTIONS, type: 'svg' });
  writeFileSync(join(OUT, `${name}.svg`), svg);
  const png = await QRCode.toBuffer(content, {
    ...QR_OPTIONS,
    type: 'png',
    width: 2000,
  });
  writeFileSync(join(OUT, `${name}.png`), png);
  return png;
}

function centered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = NAVY
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (page.getWidth() - width) / 2,
    y,
    size,
    font,
    color,
  });
}

async function buildScenarioSheet(pngs: Map<string, Uint8Array>) {
  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const qrSize = 52 * MM;
  const rowHeight = 50 * MM;

  for (let start = 0; start < DEMO_QR_SCENARIOS.length; start += PER_PAGE) {
    const page = pdf.addPage(A4);
    centered(page, 'DÉMONSTRATION — Sécuri’Click', A4[1] - 16 * MM, bold, 18);
    centered(
      page,
      'Dans l’application : rôle Établissement, onglet Scanner. Codes fictifs, sans effet réel.',
      A4[1] - 23 * MM,
      regular,
      9.5,
      MUTED
    );
    centered(
      page,
      'Avec l’appareil photo du téléphone : ouvre la page de téléchargement de l’application.',
      A4[1] - 28 * MM,
      regular,
      9.5,
      MUTED
    );

    let y = A4[1] - 36 * MM - qrSize;
    for (const scenario of DEMO_QR_SCENARIOS.slice(start, start + PER_PAGE)) {
      const text = SCENARIO_TEXT[scenario.id];
      const image = await pdf.embedPng(
        pngs.get(scenario.id) ?? new Uint8Array()
      );
      const x = 16 * MM;
      page.drawImage(image, {
        x,
        y: y + (rowHeight - qrSize) / 2 + 2 * MM,
        width: qrSize * 0.9,
        height: qrSize * 0.9,
      });
      const tx = x + qrSize + 4 * MM;
      const ok = scenario.expected === 'validated';
      page.drawText(`QR ${scenario.number}`, {
        x: tx,
        y: y + rowHeight - 12 * MM,
        size: 20,
        font: bold,
        color: NAVY,
      });
      page.drawText(text.title, {
        x: tx,
        y: y + rowHeight - 20 * MM,
        size: 12,
        font: bold,
        color: rgb(0.1, 0.1, 0.12),
      });
      page.drawText(text.outcome, {
        x: tx,
        y: y + rowHeight - 27 * MM,
        size: 11.5,
        font: bold,
        color: ok ? GREEN : RED,
      });
      page.drawText(text.detail, {
        x: tx,
        y: y + rowHeight - 33 * MM,
        size: 10,
        font: regular,
        color: MUTED,
      });
      page.drawText('DÉMONSTRATION', {
        x: tx,
        y: y + rowHeight - 40 * MM,
        size: 8,
        font: bold,
        color: MUTED,
      });
      page.drawLine({
        start: { x: 12 * MM, y: y + 1 * MM },
        end: { x: A4[0] - 12 * MM, y: y + 1 * MM },
        thickness: 0.4,
        color: rgb(0.85, 0.85, 0.85),
      });
      y -= rowHeight;
    }
  }
  writeFileSync(join(OUT, 'planche-10-qr-scenarios-A4.pdf'), await pdf.save());
}

async function buildStandSheet(
  stand: (typeof STANDS)[number],
  png: Uint8Array
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(A4);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const image = await pdf.embedPng(png);

  centered(page, stand.title, A4[1] - 40 * MM, bold, 21);
  stand.subtitle.forEach((line, index) =>
    centered(page, line, A4[1] - (52 + index * 7) * MM, regular, 14, MUTED)
  );
  const size = 120 * MM;
  page.drawImage(image, {
    x: (A4[0] - size) / 2,
    y: A4[1] - 75 * MM - size,
    width: size,
    height: size,
  });
  centered(page, 'Scanner pour télécharger', A4[1] - 205 * MM, bold, 24);
  centered(
    page,
    'Avec l’appareil photo de votre téléphone · App Store ou Google Play',
    A4[1] - 215 * MM,
    regular,
    10.5,
    MUTED
  );
  centered(
    page,
    stand.url.replace(/^https?:\/\//, ''),
    18 * MM,
    regular,
    9,
    MUTED
  );
  writeFileSync(join(OUT, `${stand.id}-A4.pdf`), await pdf.save());
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const pngs = new Map<string, Uint8Array>();
  for (const scenario of DEMO_QR_SCENARIOS) {
    pngs.set(
      scenario.id,
      await writeQrFiles(
        `qr-${scenario.number}-${scenario.id}`,
        scenario.payload
      )
    );
  }
  await buildScenarioSheet(pngs);
  for (const stand of STANDS) {
    await buildStandSheet(stand, await writeQrFiles(stand.id, stand.url));
  }
  console.log(`QR codes écrits dans ${OUT}`);
}

main();
