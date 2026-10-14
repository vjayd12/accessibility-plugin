import { Component } from '@angular/core'
import { BannerComponent } from '../../components/banner/banner.component'
import { CardComponent } from '../../components/card/card.component'
import { cards, Card } from '../../data/cards'

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [BannerComponent, CardComponent],
  templateUrl: './card-list.component.html',
  styleUrl: './card-list.component.css',
})
export class CardListComponent {
  cards: Card[] = cards
}
