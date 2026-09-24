import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">CardApp</Link>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/iframe">Iframe Demo</Link>
      </div>
    </nav>
  )
}
