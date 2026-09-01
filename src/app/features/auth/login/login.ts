import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthError } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true],
  });

  protected readonly submitting = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly currentYear = new Date().getFullYear();

  protected get email() {
    return this.form.controls.email;
  }

  protected get password() {
    return this.form.controls.password;
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.form.disable({ emitEvent: false });

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.enable({ emitEvent: false });
        void this.router.navigateByUrl(this.returnUrl());
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.form.enable({ emitEvent: false });
        this.errorMessage.set(
          error instanceof AuthError
            ? error.message
            : 'We could not sign you in right now. Please try again.',
        );
      },
    });
  }

  private returnUrl(): string {
    const requested = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
    return typeof requested === 'string' && requested.startsWith('/') ? requested : '/dashboard';
  }
}
