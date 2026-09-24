import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { cards, Card } from '../../data/cards'

@Component({
  selector: 'app-card-detail',
  standalone: true,
  templateUrl: './card-detail.component.html',
  styleUrl: './card-detail.component.css',
})
export class CardDetailComponent implements OnInit {
  card: Card | undefined

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    this.card = cards.find((c) => c.id === id)
  }

  goBack() {
    this.router.navigate(['/'])
  }
}
