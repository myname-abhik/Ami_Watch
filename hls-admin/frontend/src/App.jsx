import { useEffect, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import './App.css'

export default function App() {
  const [videos, setVideos] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/videos', { signal: ctrl.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || res.statusText)
        return data.videos
      })
      .then((list) => {
        setVideos(list)
        // ?v=<name> deep-links to a video, otherwise play the first one
        const wanted = new URLSearchParams(location.search).get('v')
        setSelected((list.find((v) => v.name === wanted) || list[0] || null)?.name ?? null)
      })
      .catch((e) => e.name !== 'AbortError' && setError(e.message))
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  const current = videos.find((v) => v.name === selected)

  function pick(name) {
    setSelected(name)
    const url = new URL(location.href)
    url.searchParams.set('v', name)
    history.replaceState(null, '', url)
  }

  return (
    <main className="wrap">
      <header>
        <h1>Videos</h1>
        <a href="/admin">Admin</a>
      </header>

      {loading && <p className="note">Loading…</p>}
      {error && <p className="note error">Could not load videos: {error}</p>}
      {!loading && !error && !videos.length && (
        <p className="note">No videos yet. Add one from the admin panel (Convert video).</p>
      )}

      {current && (
        <>
          <VideoPlayer src={current.url} />
          <h2>{current.name}</h2>
        </>
      )}

      {videos.length > 1 && (
        <ul className="list">
          {videos.map((v) => (
            <li key={v.name}>
              <button className={v.name === selected ? 'active' : ''} onClick={() => pick(v.name)}>
                {v.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
