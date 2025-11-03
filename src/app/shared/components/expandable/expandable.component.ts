import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-expandable',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expandable.component.html',
  styleUrl: './expandable.component.css',
})
export class ExpandableComponent {
  // Inputs
  title = input.required<string>();
  routerLink = input<string | null>(null);
  isExpanded = input<boolean>(false);
  badge = input<string | null>(null);
  badgeColor = input<'blue' | 'green'>('green');
  loading = input<boolean>(false);

  // Internal state
  internalExpanded = signal<boolean>(false);

  // Outputs
  expandedChange = output<boolean>();

  constructor() {
    // Sync external isExpanded with internal state
    effect(() => {
      const external = this.isExpanded();
      if (this.internalExpanded() !== external) {
        this.internalExpanded.set(external);
      }
    });
  }

  toggle(): void {
    this.internalExpanded.update((expanded) => {
      const newValue = !expanded;
      this.expandedChange.emit(newValue);
      return newValue;
    });
  }

  get expanded(): boolean {
    return this.internalExpanded();
  }
}
