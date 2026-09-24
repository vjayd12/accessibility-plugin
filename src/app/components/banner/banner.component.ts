import { Component } from '@angular/core'
import { ImageComponent } from '../image/image.component'

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.css',
})
export class BannerComponent {}
