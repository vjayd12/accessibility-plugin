import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-image',
  standalone: true,
  templateUrl: './image.component.html',
  styleUrl: './image.component.css',
})
export class ImageComponent {
  @Input() src = ''
  @Input() alt = ''
  @Input() height = 'auto'
}
