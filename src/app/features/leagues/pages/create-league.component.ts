import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ScoringSystem } from '../models/league.model';
import { LeagueSignalStore } from '../store/league.signal-store';

@Component({
  selector: 'app-create-league',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './create-league.component.html',
})
export class CreateLeagueComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private leagueStore = inject(LeagueSignalStore);
  private router = inject(Router);

  createForm: FormGroup;
  loading = this.leagueStore.loading;
  error = this.leagueStore.error;
  showAdvanced = false;

  // Form control getters for template
  get name() {
    return this.createForm.get('name');
  }
  get description() {
    return this.createForm.get('description');
  }
  get gameType() {
    return this.createForm.get('gameType');
  }

  // Static data for templates
  gameTypes = [
    { value: 'tennis', label: 'Tennis' },
    { value: 'badminton', label: 'Badminton' },
    { value: 'table_tennis', label: 'Table Tennis' },
    { value: 'squash', label: 'Squash' },
    { value: 'other', label: 'Other' },
  ];

  scoringSystems = [
    {
      value: 'standard',
      label: 'Standard (3-1-0)',
      description: 'Win: 3 points, Draw: 1 point, Loss: 0 points',
    },
    { value: 'custom', label: 'Custom Points', description: 'Set your own point values' },
  ];

  constructor() {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      gameType: ['tennis', [Validators.required]],
      isPrivate: [false],
      // Advanced settings
      scoringSystem: ['standard', [Validators.required]],
      maxPlayers: [8, [Validators.min(2), Validators.max(32)]],
      allowDraws: [false],
      pointsPerWin: [3, [Validators.min(1), Validators.max(10)]],
      pointsPerDraw: [1, [Validators.min(0), Validators.max(5)]],
      pointsPerLoss: [0, [Validators.min(0), Validators.max(5)]],
    });

    // Handle successful league creation
    effect(() => {
      const leagues = this.leagueStore.leagues();
      const loading = this.loading();

      // If we just finished loading and have leagues, navigate to the first one
      if (!loading && leagues.length > 0) {
        const newLeague = leagues[0]; // Assuming the newest league is first
        this.router.navigate(['/leagues', newLeague.id]);
      }
    });
  }

  ngOnInit(): void {
    // Clear any existing errors
    this.leagueStore.clearError();
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe with signal store
  }

  onSubmit(): void {
    if (this.createForm.valid) {
      const formData = this.createForm.value;

      const createData = {
        name: formData.name,
        description: formData.description || undefined,
        gameType: formData.gameType,
        isPrivate: formData.isPrivate,
        settings: this.showAdvanced
          ? {
              scoringSystem: formData.scoringSystem as ScoringSystem,
              maxPlayers: formData.maxPlayers,
              allowDraws: formData.allowDraws,
              pointsPerWin: formData.pointsPerWin,
              pointsPerDraw: formData.pointsPerDraw,
              pointsPerLoss: formData.pointsPerLoss,
            }
          : undefined,
      };

      this.leagueStore.createLeague(createData);
    } else {
      this.markFormGroupTouched();
    }
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createForm.controls).forEach((key) => {
      const control = this.createForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.createForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('min')) {
      return `${fieldName} must be at least ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `${fieldName} must be at most ${control.errors?.['max'].max}`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.createForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
