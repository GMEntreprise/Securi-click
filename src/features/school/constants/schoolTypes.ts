import type { SchoolType } from '../types';

export const SCHOOL_TYPE_OPTIONS: { value: SchoolType; labelKey: string }[] = [
  { value: 'École maternelle privée', labelKey: 'school_type_private_nursery' },
  {
    value: 'École maternelle publique',
    labelKey: 'school_type_public_nursery',
  },
  { value: 'École primaire privée', labelKey: 'school_type_private_primary' },
  { value: 'École primaire publique', labelKey: 'school_type_public_primary' },
];

export function schoolTypeLabel(
  value: string,
  translate: (key: string) => string
): string {
  const option = SCHOOL_TYPE_OPTIONS.find(item => item.value === value);
  return option ? translate(option.labelKey) : value;
}
