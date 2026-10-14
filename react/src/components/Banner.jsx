import Image from './Image'
import './Banner.css'

export default function Banner() {
  return (
    <div className="banner">
      <div className="banner-content">
        <span className="banner-tag">Learn React</span>
        <h1 className="banner-title">Build modern UIs with React & Vite</h1>
        <p className="banner-subtitle">
          Browse bite-sized guides on components, hooks, routing, and performance — everything you need to ship fast.
        </p>
        <a href="#cards" className="banner-cta">Explore cards</a>
      </div>
      <div className="banner-image">
        <Image
          src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80"
          alt="React development illustration"
          height="320px"
        />
      </div>
    </div>
  )
}
