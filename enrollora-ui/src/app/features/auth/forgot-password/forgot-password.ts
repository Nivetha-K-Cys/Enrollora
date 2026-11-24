import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PasswordResetService } from '../../../core/auth/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private passwordResetService = inject(PasswordResetService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  onSubmit(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.passwordResetService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.status === 429
          ? 'Too many requests. Please try again later.'
          : 'Something went wrong. Please try again.';

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
