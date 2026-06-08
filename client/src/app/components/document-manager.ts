import { Component, inject, signal, effect, ElementRef, ViewChild, input, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../services/document.service';
import { DocumentResponse } from '../models';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="absolute inset-0 overflow-y-auto p-6 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Column: List -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-300">Group Files</h3>
            <button
              (click)="triggerIngestionPipeline()"
              [disabled]="isIngesting() || documents().length === 0"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 disabled:cursor-not-allowed font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center gap-2"
            >
              <svg *ngIf="isIngesting()" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isIngesting() ? 'Processing Pipeline...' : 'Run Ingestion Pipeline' }}
            </button>
          </div>

          <!-- Document Table Card -->
          <div class="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th class="px-5 py-3.5">Filename</th>
                  <th class="px-5 py-3.5">Status</th>
                  <th class="px-5 py-3.5">Uploaded</th>
                  <th class="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr *ngIf="documents().length === 0">
                  <td colspan="4" class="px-5 py-8 text-center text-slate-500 text-sm">
                    No documents uploaded to this group yet. Use the upload zone on the right!
                  </td>
                </tr>
                <tr *ngFor="let doc of documents()" class="hover:bg-slate-800/20 transition-all animate-fade-in">
                  <td class="px-5 py-4 min-w-0">
                    <div class="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-indigo-400 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <span class="font-medium text-slate-200 truncate">{{ doc.originalFileName }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <span [class]="'text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border ' + 
                      (doc.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                       doc.status === 'PROCESSING' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' : 
                       doc.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                       'bg-slate-800 text-slate-400 border-slate-700')">
                      {{ doc.status }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-xs text-slate-400">
                    {{ doc.uploadedAt | date:'mediumDate' }}
                  </td>
                  <td class="px-5 py-4 text-right">
                    <button
                      *ngIf="canManageDocs()"
                      (click)="onDeleteDoc(doc.id)"
                      class="p-1.5 rounded-lg bg-slate-950/40 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800/40 hover:border-rose-900 transition-all text-slate-500 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Column: Upload -->
        <div class="space-y-4">
          <h3 class="font-bold text-slate-300">Upload Documents</h3>
          <div class="backdrop-blur-xl bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            
            <div *ngIf="errorMessage()" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center rounded-xl animate-shake">
              {{ errorMessage() }}
            </div>

            <!-- Drag Drop Zone -->
            <div
              *ngIf="canManageDocs()"
              (dragover)="$event.preventDefault()"
              (drop)="onFileDrop($event)"
              class="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-8 text-center bg-slate-950/20 hover:bg-indigo-950/5 transition-all duration-300 group cursor-pointer relative"
            >
              <input
                #fileInput
                type="file"
                multiple
                (change)="onFileSelected($event)"
                class="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div class="space-y-3">
                <div class="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-300">Drag files here or click to browse</p>
                  <p class="text-xs text-slate-500 mt-1">Supports PDF, TXT, DOCX up to 10MB</p>
                </div>
              </div>
            </div>

            <!-- View-Only Info for Members -->
            <div *ngIf="!canManageDocs()" class="p-4 bg-slate-950/30 border border-slate-850 rounded-xl text-center">
              <p class="text-xs text-slate-500">You have read-only access to this group's documents.</p>
            </div>

            <!-- Selected Files List -->
            <div *ngIf="stagedFiles.length > 0" class="space-y-3">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Staged Files ({{ stagedFiles.length }})</p>
              <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                <div *ngFor="let file of stagedFiles; let i = index" class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                  <span class="truncate text-slate-300 font-medium pr-2">{{ file.name }}</span>
                  <button (click)="removeStagedFile(i)" class="text-slate-500 hover:text-rose-400 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Upload Trigger -->
              <button
                (click)="uploadStagedFiles()"
                [disabled]="isUploading()"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <svg *ngIf="isUploading()" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isUploading() ? 'Uploading...' : 'Upload Files' }}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  `
})
export class DocumentManagerComponent implements OnDestroy {
  groupId = input.required<string>();
  isSystemAdmin = input<boolean>(false);
  userRole = input<'OWNER' | 'MEMBER'>('MEMBER');

  deleteRequest = output<string>();

  private documentService = inject(DocumentService);

  documents = signal<DocumentResponse[]>([]);
  stagedFiles: File[] = [];
  isUploading = signal(false);
  isIngesting = signal(false);
  errorMessage = signal('');

  private pollingInterval: any = null;

  constructor() {
    // Re-fetch documents whenever the active groupId changes
    effect(() => {
      const gId = this.groupId();
      if (gId) {
        this.stagedFiles = [];
        this.errorMessage.set('');
        this.fetchGroupDocuments(gId);
      }
    });

    // Handle background document status polling
    effect(() => {
      const gId = this.groupId();
      const docs = this.documents();
      const hasProcessing = docs.some(d => d.status === 'PROCESSING');
      if (gId && hasProcessing) {
        this.startDocumentPolling();
      } else {
        this.stopDocumentPolling();
      }
    });
  }

  canManageDocs(): boolean {
    return this.userRole() === 'OWNER' || this.isSystemAdmin();
  }

  fetchGroupDocuments(groupId: string): void {
    this.documentService.getDocumentsByGroup(groupId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        const isAnyProcessing = docs.some(d => d.status === 'PROCESSING');
        this.isIngesting.set(isAnyProcessing);
      },
      error: () => console.error('Failed to load group documents.')
    });
  }

  startDocumentPolling(): void {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(() => {
      const gId = this.groupId();
      if (gId) {
        this.documentService.getDocumentStatuses(gId).subscribe({
          next: (statuses) => {
            // Update local documents statuses in-place
            this.documents.update(currentDocs => {
              return currentDocs.map(d => {
                const matchingStatus = statuses.find(s => s.id === d.id);
                if (matchingStatus) {
                  return { ...d, status: matchingStatus.status };
                }
                return d;
              });
            });

            const isAnyProcessing = statuses.some(s => s.status === 'PROCESSING');
            this.isIngesting.set(isAnyProcessing);
            if (!isAnyProcessing) {
              this.stopDocumentPolling();
              // Trigger a final full reload of document details to ensure all metadata is synchronized
              this.fetchGroupDocuments(gId);
            }
          },
          error: () => {
            this.stopDocumentPolling();
          }
        });
      }
    }, 8000);
  }

  stopDocumentPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  onFileSelected(event: any): void {
    const filesList = event.target.files as FileList;
    if (filesList && filesList.length > 0) {
      for (let i = 0; i < filesList.length; i++) {
        this.stagedFiles.push(filesList[i]);
      }
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const filesList = event.dataTransfer?.files;
    if (filesList && filesList.length > 0) {
      for (let i = 0; i < filesList.length; i++) {
        this.stagedFiles.push(filesList[i]);
      }
    }
  }

  removeStagedFile(index: number): void {
    this.stagedFiles.splice(index, 1);
  }

  uploadStagedFiles(): void {
    const gId = this.groupId();
    if (!gId || this.stagedFiles.length === 0) return;

    this.isUploading.set(true);
    this.errorMessage.set('');
    this.documentService.uploadDocuments(this.stagedFiles, gId).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.stagedFiles = [];
        this.fetchGroupDocuments(gId);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.errorMessage.set(err.error?.message || 'File upload failed.');
      }
    });
  }

  onDeleteDoc(docId: string): void {
    this.deleteRequest.emit(docId);
  }

  triggerIngestionPipeline(): void {
    const gId = this.groupId();
    if (!gId) return;

    this.isIngesting.set(true);
    this.errorMessage.set('');
    this.documentService.triggerIngestion(gId).subscribe({
      next: () => {
        this.fetchGroupDocuments(gId);
      },
      error: () => {
        this.isIngesting.set(false);
        this.errorMessage.set('Failed to start ingestion pipeline.');
      }
    });
  }

  ngOnDestroy(): void {
    this.stopDocumentPolling();
  }
}
