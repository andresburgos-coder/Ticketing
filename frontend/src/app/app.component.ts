import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main>
      <h1>Ticket Sales System</h1>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    h1 {
      color: #333;
      margin-bottom: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'Ticket Sales System';
}
