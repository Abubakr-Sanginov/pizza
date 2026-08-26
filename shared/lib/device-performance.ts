export type DevicePerformance = 'low' | 'high';

/**
 * Эвристическая оценка производительности устройства клиента.
 * Учитывает число ядер CPU, объём памяти, экономию трафика
 * и системную настройку «уменьшить движение».
 */
export function detectDevicePerformance(): DevicePerformance {
  if (typeof window === 'undefined') return 'high';

  try {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };

    const cores = nav.hardwareConcurrency ?? 8;
    const memory = nav.deviceMemory ?? 8;
    const saveData = nav.connection?.saveData === true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (saveData || reducedMotion) return 'low';
    if (cores <= 4 || memory <= 4) return 'low';

    return 'high';
  } catch {
    return 'high';
  }
}
