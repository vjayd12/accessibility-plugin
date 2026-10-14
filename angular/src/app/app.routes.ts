import { Routes } from '@angular/router'
import { CardListComponent } from './pages/card-list/card-list.component'
import { CardDetailComponent } from './pages/card-detail/card-detail.component'

export const routes: Routes = [
  { path: '', component: CardListComponent },
  { path: 'cards/:id', component: CardDetailComponent },
]
