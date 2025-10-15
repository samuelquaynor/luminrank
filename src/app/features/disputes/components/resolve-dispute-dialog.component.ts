import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DisputeWithDetails, ResolveDisputeRequest } from '../models/dispute.model';

@Component({
  selector: 'app-resolve-dispute-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div class="bg-gray-800 rounded-lg w-full max-w-md p-4">
        <!-- Header -->
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold text-white">Resolve Dispute</h2>
          <button
            type="button"
            (click)="onCancel()"
            class="text-gray-400 hover:text-white transition-colors"
            data-testid="close-resolve-dispute-dialog-button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Dispute Info -->
        <div class="bg-gray-700 rounded p-3 mb-3">
          <p class="text-xs text-gray-400 mb-1">Disputed by {{ dispute.disputed_by_name }}</p>
          <p class="text-sm text-white">{{ dispute.reason }}</p>
          
          <!-- Proposed Scores -->
          <div *ngIf="dispute.proposed_scores" class="mt-2">
            <p class="text-xs text-gray-400 mb-1">Proposed Scores:</p>
            <div *ngFor="let participant of getProposedScores()" class="flex justify-between text-sm">
              <span class="text-gray-300">{{ participant.name }}</span>
              <span class="text-white font-medium">{{ participant.score }}</span>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form [formGroup]="resolveForm" (ngSubmit)="onSubmit()">
          <!-- Resolution Type -->
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-300 mb-2">Resolution</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  formControlName="resolution"
                  value="accepted"
                  class="mr-2"
                  data-testid="resolution-accept-radio"
                />
                <span class="text-sm text-gray-300">Accept Proposed Changes</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  formControlName="resolution"
                  value="rejected"
                  class="mr-2"
                  data-testid="resolution-reject-radio"
                />
                <span class="text-sm text-gray-300">Reject - Keep Original Scores</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  formControlName="resolution"
                  value="modified"
                  class="mr-2"
                  data-testid="resolution-modify-radio"
                />
                <span class="text-sm text-gray-300">Modify - Agree on Different Scores</span>
              </label>
            </div>
          </div>

          <!-- New Scores (Only for Modified) -->
          <div *ngIf="resolveForm.value.resolution === 'modified'" class="mb-3">
            <label class="block text-xs font-medium text-gray-300 mb-2">New Scores</label>
            <div *ngFor="let participant of dispute.match_details?.participants || []; let i = index" class="flex items-center gap-2 mb-2">
              <span class="text-sm text-gray-300 flex-1">{{ participant.display_name }}</span>
              <input
                type="number"
                [value]="participant.score"
                (input)="onScoreChange(participant.profile_id, $event)"
                min="0"
                class="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary"
                [attr.data-testid]="'new-score-' + i"
              />
            </div>
          </div>

          <!-- Resolution Notes -->
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              formControlName="notes"
              rows="2"
              class="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add any notes about the resolution..."
              data-testid="resolution-notes-input"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              type="button"
              (click)="onCancel()"
              class="flex-1 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              data-testid="cancel-resolve-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="resolveForm.invalid"
              class="flex-1 py-2 text-sm font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-resolve-button"
            >
              Resolve Dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ResolveDisputeDialogComponent implements OnInit {
  @Input() dispute!: DisputeWithDetails;
  @Output() resolve = new EventEmitter<ResolveDisputeRequest>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  
  resolveForm: FormGroup;
  newScores: Record<string, number> = {};

  constructor() {
    this.resolveForm = this.fb.group({
      resolution: ['accepted'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Initialize new scores with current scores
    if (this.dispute.match_details) {
      this.dispute.match_details.participants.forEach(p => {
        this.newScores[p.profile_id] = p.score;
      });
    }
  }

  getProposedScores(): Array<{ name: string; score: number }> {
    if (!this.dispute.proposed_scores || !this.dispute.match_details) {
      return [];
    }

    return this.dispute.match_details.participants.map(p => ({
      name: p.display_name,
      score: this.dispute.proposed_scores?.[p.profile_id] || p.score
    }));
  }

  onScoreChange(participantId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const score = parseInt(input.value, 10);
    if (!isNaN(score)) {
      this.newScores[participantId] = score;
    }
  }

  onSubmit(): void {
    if (this.resolveForm.valid) {
      const request: ResolveDisputeRequest = {
        dispute_id: this.dispute.id,
        resolution: this.resolveForm.value.resolution,
        resolution_notes: this.resolveForm.value.notes || undefined,
        new_scores: this.resolveForm.value.resolution === 'modified' ? this.newScores : undefined
      };
      this.resolve.emit(request);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

