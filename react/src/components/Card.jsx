import { useNavigate } from 'react-router-dom'
import './Card.css'

export default function Card({ id, title, category, description, date }) {
  const navigate = useNavigate()

  return (
    <div className="card" onClick={() => navigate(`/cards/${id}`)}>
      <span className="card-category">{category}</span>
      <h2 className="card-title">{title}</h2>
      <p className="card-description">{description}</p>
      <span className="card-date">{date}</span>
    </div>
  )
}
