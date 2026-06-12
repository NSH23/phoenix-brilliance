/** Cross-section video coordination (hero stack + reels carousel). */

export const VIDEO_EXCLUSIVE_PLAY = "video-exclusive-play";
export const VIDEO_EXCLUSIVE_RELEASE = "video-exclusive-release";
export const REELS_EXCLUSIVE_EVENT = "reels-exclusive-play";

export type VideoPlaybackOrigin = "hero-stacked-cards" | "reels-carousel" | "youtube-slide";

export const SITE_VIDEO_SELECTOR = "[data-site-video]";

export function claimVideoPlayback(
  origin: VideoPlaybackOrigin,
  detail: Record<string, unknown> = {},
): void {
  window.dispatchEvent(
    new CustomEvent(VIDEO_EXCLUSIVE_PLAY, { detail: { origin, ...detail } }),
  );
}

export function releaseVideoPlayback(): void {
  window.dispatchEvent(new CustomEvent(VIDEO_EXCLUSIVE_RELEASE));
}

export function pauseAllSiteVideosExcept(except?: HTMLVideoElement): void {
  document.querySelectorAll(SITE_VIDEO_SELECTOR).forEach((el) => {
    if (el !== except) (el as HTMLVideoElement).pause();
  });
}

/** Stop all reels YouTube players except the slide that is about to play. */
export function closeAllReelsPlayers(exceptSlideId?: string): void {
  window.dispatchEvent(
    new CustomEvent(REELS_EXCLUSIVE_EVENT, {
      detail: { closeAll: true, exceptSlideId },
    }),
  );
}

/** Pause every other reels slide (file or YouTube) except the one starting playback. */
export function notifyReelsSlidePlay(slideId: string): void {
  window.dispatchEvent(
    new CustomEvent(REELS_EXCLUSIVE_EVENT, { detail: { slideId } }),
  );
}

let youTubeApiPromise: Promise<void> | null = null;

/** Load the YouTube IFrame API once (shared by hero + reels). */
export function ensureYouTubeIframeApiLoaded(): Promise<void> {
  if (youTubeApiPromise) return youTubeApiPromise;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.YT?.Player) {
    youTubeApiPromise = Promise.resolve();
    return youTubeApiPromise;
  }

  youTubeApiPromise = new Promise((resolve) => {
    if (w.YT?.Player) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
    const previousReady = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
  });

  return youTubeApiPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeYouTubeIframe(player: any): void {
  const iframe = player?.getIframe?.() as HTMLIFrameElement | undefined;
  if (!iframe) return;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.display = "block";
  iframe.style.border = "none";
}
