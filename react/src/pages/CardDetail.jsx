import { useParams, useNavigate } from 'react-router-dom'
import { cards } from '../data/cards'
import './CardDetail.css'

export default function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const card = cards.find((c) => c.id === Number(id))

  if (!card) {
    return (
      <div className="card-detail-page">
        <p>Card not found.</p>
        <button onClick={() => navigate('/')}>Back to cards</button>
      </div>
    )
  }

  return (
    <div className="card-detail-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Back
      </button>
      <div className="card-detail">
        <span className="card-category">{card.category}</span>
        <h1>{card.title}</h1>
        <span className="card-date">{card.date}</span>
        <p className="card-description">{card.description}</p>
        <hr />
        <p className="card-body">{card.body}</p>
      </div>
    </div>
  )
}
