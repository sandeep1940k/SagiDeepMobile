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

  /** Global footer promo: opens this watch URL; thumbnail uses YouTube’s `i.ytimg.com` CDN. */
  footerPromoVideoId: 'chf0Zzg5W-c',
  footerPromoVideoUrl: 'https://youtu.be/chf0Zzg5W-c',
  /** Copy from the video page on YouTube when you change `footerPromoVideoUrl`. */
  footerPromoVideoTitle:
    '🔥 अग्निपुराण अध्याय 23 | भगवान विष्णु पूजा की सम्पूर्ण विधि 🕉️ | Narad Ji Explained',
  footerPromoVideoDescription:
    'अग्नि पुराण अध्याय 23 — नारद जी की व्याख्या के साथ भगवान विष्णु की पूजा की सम्पूर्ण विधि। पूरा एपिसोड YouTube पर देखें।',

  /** Label on the footer promo button (top row, right of thumbnail). */
  footerPromoButtonLabel: 'Update',

  /** Gold “NEW” chip on the promo thumbnail; set to '' to hide when the video is no longer new. */
  footerPromoNewBadgeText: 'NEW',
}
