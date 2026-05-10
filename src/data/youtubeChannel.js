/**
 * Shared SagiDeep / @sagideep links for promos and watch page actions.
 *
 * **Counts without an API key:** set `manualStatsLine` to whatever you want shown (copy phrasing from
 * your channel page on YouTube, e.g. "12K subscribers · 48 videos"). Update it whenever you like.
 *
 * **Live counts:** if you add `VITE_YOUTUBE_API_KEY` in `.env`, the app fetches real numbers unless
 * `manualStatsLine` is non-empty (manual wins).
 */
export const youtubeChannel = {
  displayName: 'SagiDeep',
  handle: 'sagideep',
  url: 'https://www.youtube.com/@sagideep',
  subscribeUrl: 'https://www.youtube.com/@sagideep?sub_confirmation=1',
  /** Larger size looks sharper in UI; keep in sync with scripts/generate-android-launcher-icons.mjs */
  avatarUrl:
    'https://yt3.googleusercontent.com/kuUPRZ_17dMSqxyrEsCaH1KPpscV-PY9XjDwW49RJgmmmilCot6zX_VMm5hCmXQHLRE5O4VHPw=s512-c-k-c0x00ffffff-no-rj',
  /** e.g. "10K subscribers · 5 videos" — leave '' to rely on API only, or show nothing without a key */
  manualStatsLine: '90 subscribers',
}
