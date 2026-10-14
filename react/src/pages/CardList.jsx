import Card from '../components/Card'
import Banner from '../components/Banner'
import { cards } from '../data/cards'
import './CardList.css'

export default function CardList() {
  return (
    <div className="card-list-page">
      <Banner />
      <div id="cards" className="card-section">
        <h2 className="section-title">All Cards</h2>
        <div className="card-grid">
          {cards.map((card) => (
            <Card key={card.id} {...card} />
          ))}
        </div>
      </div>
    </div>
  )
}
