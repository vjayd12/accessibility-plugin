import { useState } from 'react'
import './Image.css'

export default function Image({ src, alt = '', width, height, className = '' }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={`img-wrapper ${className}`} style={{ width, height }}>
      {!loaded && !error && <div className="img-placeholder" />}
      {error ? (
        <div className="img-error">Image unavailable</div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={loaded ? 'img-visible' : 'img-hidden'}
        />
      )}
    </div>
  )
}
