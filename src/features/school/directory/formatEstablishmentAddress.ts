interface AddressSource {
  address_line_1: string | null;
  address_line_2: string | null;
  address_line_3: string | null;
  postal_code: string;
  city: string;
}

export interface FormattedAddress {
  street: string;
  locality: string;
}

function comparable(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function formatEstablishmentAddress(
  source: AddressSource
): FormattedAddress {
  const locality = `${source.postal_code} ${source.city}`.trim();
  const localityKey = comparable(locality);
  const cityKey = comparable(source.city);
  const postalKey = comparable(source.postal_code);
  const seen = new Set<string>();
  const street: string[] = [];

  for (const line of [
    source.address_line_1,
    source.address_line_2,
    source.address_line_3,
  ]) {
    const trimmed = line?.trim();
    if (!trimmed) continue;
    const key = comparable(trimmed);
    if (!key || key === localityKey || key === cityKey || key === postalKey) {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    street.push(trimmed);
  }

  return { street: street.join(', '), locality };
}
