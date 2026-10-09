import type { Location } from './types'

/** Representative city per IANA zone: [label, lat, lng]. Covers the common zones; others fall back to longitude from UTC offset. */
const ZONES: Record<string, [string, number, number]> = {
  'Europe/London': ['London', 51.51, -0.13],
  'Europe/Dublin': ['Dublin', 53.35, -6.26],
  'Europe/Lisbon': ['Lisbon', 38.72, -9.14],
  'Europe/Madrid': ['Madrid', 40.42, -3.7],
  'Europe/Paris': ['Paris', 48.86, 2.35],
  'Europe/Brussels': ['Brussels', 50.85, 4.35],
  'Europe/Amsterdam': ['Amsterdam', 52.37, 4.9],
  'Europe/Berlin': ['Berlin', 52.52, 13.4],
  'Europe/Zurich': ['Zurich', 47.38, 8.54],
  'Europe/Rome': ['Rome', 41.9, 12.5],
  'Europe/Vienna': ['Vienna', 48.21, 16.37],
  'Europe/Prague': ['Prague', 50.08, 14.44],
  'Europe/Warsaw': ['Warsaw', 52.23, 21.01],
  'Europe/Stockholm': ['Stockholm', 59.33, 18.07],
  'Europe/Oslo': ['Oslo', 59.91, 10.75],
  'Europe/Copenhagen': ['Copenhagen', 55.68, 12.57],
  'Europe/Helsinki': ['Helsinki', 60.17, 24.94],
  'Europe/Athens': ['Athens', 37.98, 23.73],
  'Europe/Istanbul': ['Istanbul', 41.01, 28.98],
  'Europe/Kyiv': ['Kyiv', 50.45, 30.52],
  'Europe/Moscow': ['Moscow', 55.76, 37.62],
  'Atlantic/Reykjavik': ['Reykjavík', 64.15, -21.94],
  'Africa/Cairo': ['Cairo', 30.04, 31.24],
  'Africa/Johannesburg': ['Johannesburg', -26.2, 28.05],
  'Africa/Lagos': ['Lagos', 6.52, 3.38],
  'Africa/Nairobi': ['Nairobi', -1.29, 36.82],
  'Africa/Casablanca': ['Casablanca', 33.57, -7.59],
  'Asia/Dubai': ['Dubai', 25.2, 55.27],
  'Asia/Karachi': ['Karachi', 24.86, 67.0],
  'Asia/Kolkata': ['Mumbai', 19.08, 72.88],
  'Asia/Dhaka': ['Dhaka', 23.81, 90.41],
  'Asia/Bangkok': ['Bangkok', 13.76, 100.5],
  'Asia/Jakarta': ['Jakarta', -6.2, 106.85],
  'Asia/Singapore': ['Singapore', 1.35, 103.82],
  'Asia/Kuala_Lumpur': ['Kuala Lumpur', 3.14, 101.69],
  'Asia/Hong_Kong': ['Hong Kong', 22.32, 114.17],
  'Asia/Shanghai': ['Shanghai', 31.23, 121.47],
  'Asia/Taipei': ['Taipei', 25.03, 121.57],
  'Asia/Manila': ['Manila', 14.6, 120.98],
  'Asia/Seoul': ['Seoul', 37.57, 126.98],
  'Asia/Tokyo': ['Tokyo', 35.68, 139.69],
  'Asia/Jerusalem': ['Jerusalem', 31.77, 35.21],
  'Asia/Riyadh': ['Riyadh', 24.71, 46.68],
  'Asia/Tehran': ['Tehran', 35.69, 51.39],
  'Australia/Perth': ['Perth', -31.95, 115.86],
  'Australia/Adelaide': ['Adelaide', -34.93, 138.6],
  'Australia/Brisbane': ['Brisbane', -27.47, 153.03],
  'Australia/Sydney': ['Sydney', -33.87, 151.21],
  'Australia/Melbourne': ['Melbourne', -37.81, 144.96],
  'Pacific/Auckland': ['Auckland', -36.85, 174.76],
  'Pacific/Honolulu': ['Honolulu', 21.31, -157.86],
  'America/Anchorage': ['Anchorage', 61.22, -149.9],
  'America/Los_Angeles': ['Los Angeles', 34.05, -118.24],
  'America/Vancouver': ['Vancouver', 49.28, -123.12],
  'America/Phoenix': ['Phoenix', 33.45, -112.07],
  'America/Denver': ['Denver', 39.74, -104.99],
  'America/Chicago': ['Chicago', 41.88, -87.63],
  'America/Mexico_City': ['Mexico City', 19.43, -99.13],
  'America/New_York': ['New York', 40.71, -74.01],
  'America/Toronto': ['Toronto', 43.65, -79.38],
  'America/Halifax': ['Halifax', 44.65, -63.58],
  'America/Bogota': ['Bogotá', 4.71, -74.07],
  'America/Lima': ['Lima', -12.05, -77.04],
  'America/Santiago': ['Santiago', -33.45, -70.67],
  'America/Sao_Paulo': ['São Paulo', -23.55, -46.63],
  'America/Argentina/Buenos_Aires': ['Buenos Aires', -34.6, -58.38],
}

/**
 * A location for an IANA time zone; unknown zones get a longitude from their UTC offset.
 * @param zone - IANA zone name, e.g. 'Europe/London'.
 * @param now - Instant used to read the UTC offset for unknown zones.
 * @return The zone's representative location, marked auto.
 */
export function locationForZone(zone: string, now = Date.now()): Location {
  const hit = ZONES[zone]
  if (hit) return { label: hit[0], lat: hit[1], lng: hit[2], auto: true }
  const offsetHours = -new Date(now).getTimezoneOffset() / 60
  return { label: zone.split('/').pop()?.replace(/_/g, ' ') ?? zone, lat: 40, lng: offsetHours * 15, auto: true }
}

/**
 * Cities offered in the Settings location picker.
 * @return Every known city, sorted by name.
 */
export function knownCities(): Location[] {
  return Object.values(ZONES)
    .map(([label, lat, lng]) => ({ label, lat, lng, auto: false }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
