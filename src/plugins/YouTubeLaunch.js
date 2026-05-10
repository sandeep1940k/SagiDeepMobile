import { registerPlugin } from '@capacitor/core'

export const YouTubeLaunch = registerPlugin('YouTubeLaunch', {
  web: () => ({
    openWatch: async ({ videoId }) => {
      const id = String(videoId || '').trim()
      if (!id) return
      window.open(
        `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
        '_blank',
        'noopener,noreferrer',
      )
    },
  }),
})
