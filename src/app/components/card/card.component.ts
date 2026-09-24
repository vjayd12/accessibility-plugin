import { Component, Input } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent {
  @Input() id = 0
  @Input() title = ''
  @Input() category = ''
  @Input() description = ''
  @Input() date = ''

  constructor(private router: Router) {}

  navigate() {
    this.router.navigate(['/cards', this.id])
  }
}
