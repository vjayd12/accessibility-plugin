import { Component, OnInit } from '@angular/core'
import { Router, RouterOutlet, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators'
import { NavbarComponent } from './components/navbar/navbar.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        requestIdleCallback(() => {
          window.DWAOAccessibility?.reinit()
        })
      })
  }
}
