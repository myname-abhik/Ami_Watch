import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

// Thin video.js wrapper. Creates the player once and swaps the source when `src` changes.
export default function VideoPlayer({ src }) {
  const hostRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!hostRef.current) return
    const el = document.createElement('video-js')
    el.classList.add('vjs-big-play-centered')
    hostRef.current.appendChild(el)

    const player = (playerRef.current = videojs(el, {
      controls: true,
      fluid: true,
      preload: 'auto',
    }))

    return () => {
      player.dispose() // also removes the element it created
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (player && src) player.src({ src, type: 'application/x-mpegURL' })
  }, [src])

  return (
    <div data-vjs-player>
      <div ref={hostRef} />
    </div>
  )
}
