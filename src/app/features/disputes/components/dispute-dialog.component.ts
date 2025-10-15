import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreateDisputeRequest } from '../models/dispute.model';

@Component({
  selector: 'app-dispute-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div class="bg-gray-800 rounded-lg w-full max-w-md p-4">
        <!-- Header -->
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold text-white">Dispute Match</h2>
          <button
            type="button"
            (click)="onCancel()"
            class="text-gray-400 hover:text-white transition-colors"
            data-testid="close-dispute-dialog-button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="disputeForm" (ngSubmit)="onSubmit()">
          <!-- Reason -->
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-300 mb-1">
              Reason for Dispute *
            </label>
            <textarea
              formControlName="reason"
              rows="3"
              class="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Explain why you're disputing this match..."
              data-testid="dispute-reason-input"
            ></textarea>
            <p *ngIf="disputeForm.get('reason')?.invalid && disputeForm.get('reason')?.touched" class="mt-1 text-xs text-red-400">
              Please provide a reason for the dispute
            </p>
          </div>

          <!-- Proposed Scores (Optional) -->
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-300 mb-2">
              Proposed Score Corrections (Optional)
            </label>
            
            <div *ngFor="let participant of matchParticipants; let i = index" class="flex items-center gap-2 mb-2">
              <span class="text-sm text-gray-300 flex-1">{{ participant.name }}</span>
              <input
                type="number"
                [value]="participant.score"
                (input)="onScoreChange(participant.id, $event)"
                min="0"
                class="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary"
                [attr.data-testid]="'proposed-score-' + i"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              type="button"
              (click)="onCancel()"
              class="flex-1 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              data-testid="cancel-dispute-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="disputeForm.invalid"
              class="flex-1 py-2 text-sm font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-dispute-button"
            >
              Submit Dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class DisputeDialogComponent {
  @Input() matchId!: string;
  @Input() matchParticipants: Array<{ id: string; name: string; score: number }> = [];
  @Output() dispute = new EventEmitter<CreateDisputeRequest>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  
  disputeForm: FormGroup;
  proposedScores: Record<string, number> = {};

  constructor() {
    this.disputeForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onScoreChange(participantId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const score = parseInt(input.value, 10);
    if (!isNaN(score)) {
      this.proposedScores[participantId] = score;
    } else {
      delete this.proposedScores[participantId];
    }
  }

  onSubmit(): void {
    if (this.disputeForm.valid) {
      const request: CreateDisputeRequest = {
        match_id: this.matchId,
        reason: this.disputeForm.value.reason,
        proposed_scores: Object.keys(this.proposedScores).length > 0 ? this.proposedScores : undefined
      };
      this.dispute.emit(request);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

