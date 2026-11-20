import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProfileService,
  StudentProfile,
  UpdateProfileRequest
} from './profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  private profileService = inject(ProfileService);
  private cdr = inject(ChangeDetectorRef);

  profile: StudentProfile | null = null;

  form: UpdateProfileRequest = {
    name: '',
    department: '',
    age: 18,
    cgpa: 0
  };

  isEditing = false;
  isLoading = false;
  isSaving = false;
  message = '';
  error = '';

  ngOnInit(): void {
    this.loadProfile();
  }

loadProfile(): void {
  this.isLoading = true;
  this.error = '';

  this.profileService.getProfile().subscribe({
    next: (data) => {
      this.profile = data;
      this.resetForm();
      this.isLoading = false;
      this.cdr.markForCheck();
    },
    error: () => {
      this.error = 'Unable to load profile';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  });
}
  resetForm(): void {
    if (!this.profile) return;

    this.form = {
      name: this.profile.name,
      department: this.profile.department,
      age: this.profile.age,
      cgpa: this.profile.cgpa
    };
  }

  editProfile(): void {
    this.message = '';
    this.error = '';
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.resetForm();
    this.isEditing = false;
  }

  saveProfile(): void {
    if (this.isSaving) return;

    this.isSaving = true;
    this.message = '';
    this.error = '';

    this.profileService.updateProfile(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.message = 'Profile updated successfully!';
        this.loadProfile();
      },
      error: () => {
        this.isSaving = false;
        this.error = 'Failed to update profile';
      }
    });
  }
}
