// Lazily-constructed, base-path-aware, failure-safe sound playback.
// Audio files live in public/audio/…; if a file is absent the call is a silent no-op,
// so decorative sounds never throw an unhandled rejection under the browser autoplay policy.
const cache: Record<string, HTMLAudioElement> = {};

export function playSound(path: string, volume = 0.4): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  try {
    const url = `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
    let audio = cache[url];
    if (!audio) {
      audio = new Audio(url);
      audio.volume = volume;
      cache[url] = audio;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    /* ignore — sound is decorative */
  }
}
