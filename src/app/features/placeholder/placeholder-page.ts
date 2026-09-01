import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/**
 * Stands in for the secondary pages the login screen links to. Each replaces
 * this component once its own flow is designed.
 */
@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink],
  template: `
    <main class="shell">
      <div class="shell__card">
        <h1>{{ title }}</h1>
        <p>This screen has not been built yet.</p>
        <a class="button button--ghost" routerLink="/login">Back to sign in</a>
      </div>
    </main>
  `,
  styleUrl: '../dashboard/dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPage {
  protected readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
