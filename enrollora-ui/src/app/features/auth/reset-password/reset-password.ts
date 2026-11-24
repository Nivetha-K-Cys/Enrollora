import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { PasswordResetService } from '../../../core/auth/password-reset.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private passwordResetService = inject(PasswordResetService);
  private cdr = inject(ChangeDetectorRef);

  private token = this.route.snapshot.queryParamMap.get('token') ?? '';

  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    if (!this.token) {
      this.errorMessage = 'Invalid or missing reset token.';
    } else {
      this.location.replaceState('/reset-password');
    }
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  onSubmit(): void {
    if (this.isLoading || this.successMessage || !this.token) return;

    this.errorMessage = '';

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must contain at least 8 characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;

    this.passwordResetService.resetPassword(
      this.token,
      this.newPassword,
      this.confirmPassword
    ).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isLoading = false;
        this.newPassword = '';
        this.confirmPassword = '';
        this.token = '';
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.status === 429
          ? 'Too many requests. Please try again later.'
          : error.error?.message || 'Something went wrong. Please try again.';

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
