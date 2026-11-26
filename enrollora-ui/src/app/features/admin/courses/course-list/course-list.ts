import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest, CourseFilter } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  // Signals
  courses = signal<CourseResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);

  totalRecords = signal(0);
  totalPages = signal(0);

  // Course form state
  isCourseModalOpen = signal(false);
  isSavingCourse = signal(false);
  courseFormError = signal('');
  courseSuccess = signal('');
  editingCourseId = signal<number | null>(null);

  courseForm = new FormGroup({
    courseName: new FormControl('', [
      Validators.required,
      Validators.maxLength(150),
      Validators.pattern(/\S/)
    ]),
    duration: new FormControl('', [
      Validators.required,
      Validators.maxLength(80),
      Validators.pattern(/\S/)
    ]),
    fees: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(999999999)
    ]),
    capacity: new FormControl(30, [
      Validators.required,
      Validators.min(1),
      Validators.max(100000),
      Validators.pattern(/^\d+$/)
    ]),
    isActive: new FormControl(true)
  });

  openAddCourse(): void {
    this.editingCourseId.set(null);
    this.courseFormError.set('');
    this.courseSuccess.set('');

    this.courseForm.reset({
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 30,
      isActive: true
    });

    this.isCourseModalOpen.set(true);
  }

  closeCourseModal(): void {
    if (this.isSavingCourse()) return;

    this.isCourseModalOpen.set(false);
    this.courseFormError.set('');
    this.editingCourseId.set(null);
  }

  saveCourse(): void {
    if (this.courseForm.invalid || this.isSavingCourse()) {
      this.courseForm.markAllAsTouched();
      return;
    }

    const value = this.courseForm.getRawValue();

    const request: SaveCourseRequest = {
      courseName: value.courseName!.trim(),
      duration: value.duration!.trim(),
      fees: value.fees!,
      capacity: value.capacity!,
      isActive: value.isActive ?? true
    };

    this.isSavingCourse.set(true);
    this.courseFormError.set('');

    const id = this.editingCourseId();

    const operation = id === null
      ? this.courseService.createCourse(request)
      : this.courseService.updateCourse(id, request);

    operation.subscribe({
      next: () => {
        this.isSavingCourse.set(false);
        this.closeCourseModal();

        this.courseSuccess.set(
          id === null
            ? 'Course added successfully!'
            : 'Course updated successfully!'
        );

        this.pageNumber.set(1);
        this.loadCourses();
      },
      error: (error) => {
        this.isSavingCourse.set(false);
        this.courseFormError.set(
          error.error?.detail ||
          error.error?.title ||
          'Unable to save course.'
        );
      }
    });
  }

  // Edit course
  editCourse(courseId: number): void {
    this.courseSuccess.set('');
    this.courseFormError.set('');

    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        this.editingCourseId.set(course.courseId);

        this.courseForm.reset({
          courseName: course.courseName,
          duration: course.duration,
          fees: course.fees,
          capacity: course.capacity,
          isActive: course.isActive
        });

        this.isCourseModalOpen.set(true);
      },
      error: (error) => {
        alert(error.error?.detail || 'Unable to load course details.');
      }
    });
  }

  // Deactivate course
  deactivateCourse(course: CourseResponse): void {
    if (!confirm(`Deactivate ${course.courseName}?`)) return;

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.courseSuccess.set('Course deactivated successfully!');
        this.loadCourses();
      },
      error: (error) => {
        alert(error.error?.detail || 'Unable to deactivate course.');
      }
    });
  }

  // Reactivate course
  activateCourse(course: CourseResponse): void {
    if (!confirm(`Activate ${course.courseName}?`)) return;

    this.courseService.getCourseById(course.courseId).subscribe({
      next: (current) => {
        const request: SaveCourseRequest = {
          courseName: current.courseName,
          duration: current.duration,
          fees: current.fees,
          capacity: current.capacity,
          isActive: true
        };

        this.courseService.updateCourse(current.courseId, request).subscribe({
          next: () => {
            this.courseSuccess.set('Course activated successfully!');
            this.loadCourses();
          },
          error: (error) => {
            alert(error.error?.detail || 'Unable to activate course.');
          }
        });
      },
      error: (error) => {
        alert(error.error?.detail || 'Unable to load course.');
      }
    });
  }

  // View course details
  selectedCourse = signal<CourseResponse | null>(null);

  viewCourse(courseId: number): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        this.selectedCourse.set(course);
      },
      error: (error) => {
        alert(error.error?.detail || 'Unable to load course details.');
      }
    });
  }

  closeCourseDetails(): void {
    this.selectedCourse.set(null);
  }

  // Course search, filters and sorting
  activeFilters = signal<CourseFilter>({});

  filterForm = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
    availability: new FormControl(''),
    minFees: new FormControl<number | null>(null),
    maxFees: new FormControl<number | null>(null),
    minCapacity: new FormControl<number | null>(null),
    maxCapacity: new FormControl<number | null>(null),
    sortBy: new FormControl('name'),
    sortOrder: new FormControl('asc')
  });

  applyFilters(): void {
    const value = this.filterForm.getRawValue();

    if (value.minFees !== null && value.maxFees !== null &&
        value.minFees > value.maxFees) {
      alert('Minimum fees cannot exceed maximum fees.');
      return;
    }

    if (value.minCapacity !== null && value.maxCapacity !== null &&
        value.minCapacity > value.maxCapacity) {
      alert('Minimum capacity cannot exceed maximum capacity.');
      return;
    }

    this.activeFilters.set({
      search: value.search?.trim() || undefined,
      isActive: value.status === '' || value.status === null
        ? null : value.status === 'true',
      availability: value.availability || undefined,
      minFees: value.minFees,
      maxFees: value.maxFees,
      minCapacity: value.minCapacity,
      maxCapacity: value.maxCapacity,
      sortBy: value.sortBy || 'name',
      sortOrder: value.sortOrder || 'asc'
    });

    this.pageNumber.set(1);
    this.loadCourses();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      availability: '',
      minFees: null,
      maxFees: null,
      minCapacity: null,
      maxCapacity: null,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    this.applyFilters();
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  // Load courses from backend
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(this.pageNumber(), this.pageSize(), this.activeFilters()).subscribe({
      next: (response) => {
        this.courses.set(response.items);

        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);

        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading courses:', error);

        this.errorMessage.set('Unable to load courses.');

        this.isLoading.set(false);
      },
    });
  }

  // Navigate to next page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);

      this.loadCourses();
    }
  }

  // Navigate to previous page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);

      this.loadCourses();
    }
  }
}
