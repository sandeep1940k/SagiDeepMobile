/**
 * `videoSrc` options:
 * - Bundled: `/videos/…/file.mp4` (under `public/videos/…`)
 * - MEGA: `https://mega.nz/file/HANDLE#KEY` (embedded in-app via MEGA’s player)
 * - Or set only `youtubeVideoId` for YouTube embed (no `videoSrc`).
 */
export const playlistsById = {
  '1': {
    id: '1',
    name: 'Renegade Immortal',
    variant: 'blood',
    coverSrc: '/playlists/renegade-immortal.png',
    videos: [
      {
        id: 'ep-1',
        title: 'Renegade Immortal Episode 1 Hindi | Weak Boy to Immortal',
        videoSrc: 'https://mega.nz/file/r5gHSRKL#GW4ts0pw9Of8r7XbjlqRfq6MJMOmZAgyhwmbnVhBqTY',
        thumbnailUrl: '/playlists/renegade-immortal/renegade-ep1.webp',
        youtubeVideoId: 'CaGP0tezJt0',
        youtubeStatsLine: '',
        duration: '',
        channelLine: 'SagiDeep',
      },
      {
        id: 'ep-2',
        title: 'Renegade Immortal Episode 2 Hindi',
        videoSrc: 'https://mega.nz/file/j9QCCBiA#Sd9HVw9SfiLtufFm4IkDdenRWyZsya-nG2k68HMwKyI',
        thumbnailUrl: '/playlists/renegade-immortal/renegade-ep2.png',
        youtubeVideoId: 'hT6iuiJUlY8',
        youtubeStatsLine: '',
        duration: '',
        channelLine: 'SagiDeep',
      },
    ],
  },
}

export const playlistsIndex = Object.values(playlistsById).map(
  ({ id, name, variant, coverSrc, videos }) => ({
    id,
    name,
    videoCount: videos.length,
    variant,
    coverSrc,
  }),
)

export function getPlaylistById(id) {
  return playlistsById[id] ?? null
}

export function getPlaylistVideo(playlistId, videoId) {
  const p = playlistsById[playlistId]
  if (!p) return null
  return p.videos.find((v) => v.id === videoId) ?? null
}
