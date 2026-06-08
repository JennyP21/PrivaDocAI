import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div (click)="onCancel()" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"></div>

      <!-- Modal Card -->
      <div class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-rose-950/10 transform transition-all duration-300 scale-100 scale-in select-none">
        
        <!-- Warning Icon -->
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 animate-pulse">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <!-- Contents -->
        <div class="text-center space-y-2 mb-6">
          <h3 class="text-lg font-bold text-slate-100 tracking-tight">{{ title() }}</h3>
          <p class="text-slate-400 text-xs leading-relaxed px-2">{{ message() }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            type="button"
            (click)="onCancel()"
            class="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700/80 active:scale-[0.98] border border-slate-700/50 text-slate-300 font-semibold rounded-xl text-xs transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onConfirm()"
            class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-600/10 transition-all duration-200"
          >
            {{ confirmText() }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .scale-in {
      animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to proceed? This action cannot be undone.');
  confirmText = input<string>('Confirm');

  confirm = output<void>();
  cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
