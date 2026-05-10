export interface ParsedAddress {
  streetName: string;
  house: string;
}

const HOUSE_REGEX = /(?:^|[\s,])(\d+[A-Za-zА-Яа-я]?(?:[\/\-]\d+[A-Za-zА-Яа-я]?)?)\b/;

export function parseAddress(raw: string | null | undefined): ParsedAddress {
  if (!raw) return { streetName: '', house: '' };

  const cleaned = raw.replace(/^Россия,?|^Таджикистан,?/i, '').trim();
  const segments = cleaned.split(',').map((s) => s.trim()).filter(Boolean);

  let streetSegment = '';
  let house = '';

  for (const segment of segments) {
    const match = segment.match(HOUSE_REGEX);
    if (match) {
      house = match[1];
      streetSegment = segment.replace(match[0], '').trim();
      break;
    }
  }

  if (!streetSegment) {
    streetSegment = segments[segments.length - 1] || cleaned;
  }

  const streetName = streetSegment.replace(/^(?:улица|ул\.?|проспект|пр\.?|переулок|пер\.?|шоссе|ш\.?|бульвар|б-р)\s+/i, '').trim();

  return { streetName: streetName || cleaned, house };
}
