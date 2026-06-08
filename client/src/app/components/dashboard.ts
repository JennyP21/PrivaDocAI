import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { GroupService } from '../services/group.service';
import { DocumentService } from '../services/document.service';
import { GroupMemberResponse, UserResponse } from '../models';
import { ChatPanelComponent } from './chat-panel';
import { DocumentManagerComponent } from './document-manager';
import { MemberManagerComponent } from './member-manager';
import { ConfirmModalComponent } from './confirm-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChatPanelComponent,
    DocumentManagerComponent,
    MemberManagerComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      <!-- SIDEBAR -->
      <aside class="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-10">
        <div>
          <!-- Sidebar Header -->
          <div class="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <span class="font-bold text-xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">PrivaDoc AI</span>
            </div>
          </div>

          <!-- Groups Section -->
          <div class="p-4">
            <div class="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider px-2 mb-3">
              <span>My Groups</span>
              <button *ngIf="isSystemAdmin()" (click)="openCreateGroupModal()" class="text-indigo-400 hover:text-indigo-300 transition-all focus:outline-none cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            <!-- Groups List -->
            <div class="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
              <div *ngIf="groups().length === 0" class="text-slate-500 text-xs text-center py-4 px-2 bg-slate-950/20 rounded-xl border border-slate-900">
                No groups joined yet. Create one above!
              </div>
              <button
                *ngFor="let g of groups()"
                (click)="selectGroup(g)"
                [class]="'w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ' + 
                  (selectedGroup()?.groupId === g.groupId 
                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-200 font-medium' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200')"
              >
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="truncate text-sm">{{ g.groupName }}</span>
                  <span class="text-[10px] text-slate-500 truncate mt-0.5">{{ g.groupDescription || 'No description' }}</span>
                </div>
                <span [class]="'text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ' + 
                  (g.groupRole === 'OWNER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-slate-800 text-slate-400')">
                  {{ g.groupRole }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar Footer (User details + Logout) -->
        <div class="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <div class="flex items-center justify-between">
            <div class="min-w-0 pr-2">
              <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Logged In As</p>
              <p class="text-sm font-semibold text-slate-300 truncate mt-0.5">{{ currentUserEmail() }}</p>
            </div>
            <button (click)="logout()" title="Logout" class="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-950 border border-transparent transition-all duration-200 text-slate-400 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        
        <!-- Header -->
        <header class="h-16 border-b border-slate-900 px-6 flex items-center justify-between z-10 backdrop-blur-md bg-slate-950/80">
          <div class="flex items-center gap-4">
            <h1 class="font-bold text-lg text-slate-200">
              {{ selectedGroup() ? selectedGroup()?.groupName : 'Dashboard' }}
            </h1>
            <span *ngIf="selectedGroup()" class="text-xs text-slate-500 font-normal">
              {{ selectedGroup()?.groupDescription }}
            </span>
            <button
              *ngIf="selectedGroup() && isSystemAdmin()"
              (click)="deleteGroup(selectedGroup()!.groupId)"
              title="Delete Group"
              class="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-950 border border-slate-800 transition-all text-slate-500 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>

          <!-- Tab Selector (if group selected) -->
          <div *ngIf="selectedGroup()" class="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              (click)="activeTab.set('chat')"
              [class]="'px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ' + 
                (activeTab() === 'chat' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200')"
            >
              Secure Chat
            </button>
            <button
              (click)="activeTab.set('docs')"
              [class]="'px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ' + 
                (activeTab() === 'docs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200')"
            >
              Documents
            </button>
            <button
              (click)="activeTab.set('members')"
              [class]="'px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ' + 
                (activeTab() === 'members' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200')"
            >
              Members
            </button>
          </div>
        </header>

        <!-- Dynamic Content Body -->
        <div class="flex-1 overflow-hidden relative">

          <!-- 1. EMPTY WELCOME STATE -->
          <div *ngIf="!selectedGroup()" class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950">
            <div class="max-w-md space-y-6">
              <div class="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-16 h-16 text-indigo-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <div class="space-y-2">
                <h3 class="text-2xl font-bold tracking-tight">Select or Create a Group</h3>
                <p class="text-slate-400 text-sm">PrivaDoc AI isolates documents and vector indexes inside security boundaries called Groups. Select a group in the sidebar, or create a new one to begin.</p>
              </div>
              <button (click)="openCreateGroupModal()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer">
                + Create New Group
              </button>
            </div>
          </div>

          <!-- 2. SECURE CHAT TAB -->
          <app-chat-panel
            *ngIf="selectedGroup() && activeTab() === 'chat'"
            [groupId]="selectedGroup()!.groupId"
            [isSystemAdmin]="isSystemAdmin()"
          ></app-chat-panel>

          <!-- 3. DOCUMENTS TAB -->
          <app-document-manager
            #documentManager
            *ngIf="selectedGroup() && activeTab() === 'docs'"
            [groupId]="selectedGroup()!.groupId"
            [isSystemAdmin]="isSystemAdmin()"
            [userRole]="selectedGroup()!.groupRole"
            (deleteRequest)="onRequestDeleteDoc($event)"
          ></app-document-manager>

          <!-- 4. MEMBERS TAB -->
          <app-member-manager
            #memberManager
            *ngIf="selectedGroup() && activeTab() === 'members'"
            [groupId]="selectedGroup()!.groupId"
            [isSystemAdmin]="isSystemAdmin()"
            [userRole]="selectedGroup()!.groupRole"
            [currentUserId]="currentUserId()"
            (kickRequest)="onRequestKickMember($event)"
          ></app-member-manager>

        </div>
      </main>
    </div>

    <!-- CREATE GROUP MODAL -->
    <div *ngIf="isCreateGroupModalOpen()" class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <!-- Backdrop -->
      <div (click)="closeCreateGroupModal()" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-200">Create New Group</h3>
          <button (click)="closeCreateGroupModal()" class="text-slate-500 hover:text-slate-400 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div *ngIf="groupModalError()" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center rounded-xl">
          {{ groupModalError() }}
        </div>

        <form (ngSubmit)="createGroup()" class="space-y-4">
          <div>
            <label class="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Group Name</label>
            <input
              type="text"
              name="newGroupName"
              required
              [(ngModel)]="newGroupName"
              class="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
              placeholder="Engineering Team, FinReports..."
            />
          </div>

          <div>
            <label class="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
            <textarea
              name="newGroupDesc"
              rows="3"
              [(ngModel)]="newGroupDesc"
              class="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm resize-none"
              placeholder="Describe the purpose of this group..."
            ></textarea>
          </div>

          <button
            type="submit"
            [disabled]="isCreatingGroup() || !newGroupName.trim()"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg *ngIf="isCreatingGroup()" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Create Group
          </button>
        </form>
      </div>
    </div>

    <!-- GLOBAL CONFIRMATION MODAL -->
    <app-confirm-modal
      [isOpen]="isConfirmModalOpen()"
      [title]="confirmModalTitle()"
      [message]="confirmModalMessage()"
      [confirmText]="confirmModalConfirmText()"
      (confirm)="onConfirmAction()"
      (cancel)="onCancelAction()"
    ></app-confirm-modal>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private groupService = inject(GroupService);
  private documentService = inject(DocumentService);

  @ViewChild('documentManager') private documentManager!: DocumentManagerComponent;
  @ViewChild('memberManager') private memberManager!: MemberManagerComponent;

  // Active User State
  currentUserId = signal<string>('');
  currentUserEmail = signal<string>('');
  isSystemAdmin = signal<boolean>(false);

  // Groups and selection state
  groups = signal<GroupMemberResponse[]>([]);
  selectedGroup = signal<GroupMemberResponse | null>(null);
  activeTab = signal<'chat' | 'docs' | 'members'>('chat');

  // Modals & form fields
  isCreateGroupModalOpen = signal(false);
  newGroupName = '';
  newGroupDesc = '';
  groupModalError = signal('');
  isCreatingGroup = signal(false);

  // Confirmation Modal State
  isConfirmModalOpen = signal(false);
  confirmModalTitle = signal('Confirm Action');
  confirmModalMessage = signal('');
  confirmModalConfirmText = signal('Confirm');
  private pendingAction: (() => void) | null = null;

  constructor() {
    // Read cached user details to set basic signal values
    const userJson = localStorage.getItem('user_details');
    if (userJson) {
      const user = JSON.parse(userJson) as UserResponse;
      this.currentUserId.set(user.id);
      this.currentUserEmail.set(user.email);
      this.isSystemAdmin.set(user.isSystemAdmin);
      this.fetchUserGroups();
    }
  }

  // Fetch groups where current user is a member, or ALL groups if user is admin
  fetchUserGroups(): void {
    const userId = this.currentUserId();
    if (!userId) return;

    if (this.isSystemAdmin()) {
      this.groupService.getAllGroups().subscribe({
        next: (allGroups) => {
          const mappedGroups: GroupMemberResponse[] = allGroups.map(g => ({
            userId: userId,
            userEmail: this.currentUserEmail(),
            groupId: g.id,
            groupName: g.name,
            groupDescription: g.description,
            groupRole: 'OWNER' // Admins get owner rights globally
          }));
          this.groups.set(mappedGroups);
          if (mappedGroups.length > 0 && !this.selectedGroup()) {
            this.selectGroup(mappedGroups[0]);
          }
        },
        error: () => console.error('Failed to load all groups.')
      });
    } else {
      this.groupService.getGroupsByMember(userId).subscribe({
        next: (groups) => {
          this.groups.set(groups);
          if (groups.length > 0 && !this.selectedGroup()) {
            this.selectGroup(groups[0]);
          }
        },
        error: () => console.error('Failed to load user groups.')
      });
    }
  }

  // Select active group workspace
  selectGroup(group: GroupMemberResponse): void {
    this.selectedGroup.set(group);
    this.activeTab.set('chat');
  }

  // LOGOUT
  logout(): void {
    this.authService.logout();
  }

  // --- MODAL TRIGGERS ---
  openCreateGroupModal(): void {
    this.newGroupName = '';
    this.newGroupDesc = '';
    this.groupModalError.set('');
    this.isCreateGroupModalOpen.set(true);
  }

  closeCreateGroupModal(): void {
    this.isCreateGroupModalOpen.set(false);
  }

  createGroup(): void {
    if (!this.newGroupName.trim()) return;
    this.isCreatingGroup.set(true);
    this.groupModalError.set('');

    this.groupService.createGroup({ name: this.newGroupName, description: this.newGroupDesc }).subscribe({
      next: (groupRes) => {
        // Group created, now add current user as OWNER
        this.groupService.addMember(groupRes.id, this.currentUserId(), 'OWNER').subscribe({
          next: () => {
            this.isCreatingGroup.set(false);
            this.closeCreateGroupModal();
            this.fetchUserGroups();
          },
          error: () => {
            this.isCreatingGroup.set(false);
            this.groupModalError.set('Failed to assign group owner membership.');
          }
        });
      },
      error: (err) => {
        this.isCreatingGroup.set(false);
        this.groupModalError.set(err.error?.message || 'Failed to create group. Name might be taken.');
      }
    });
  }

  // Generic Confirmation Trigger
  openConfirmation(title: string, message: string, confirmText: string, action: () => void) {
    this.confirmModalTitle.set(title);
    this.confirmModalMessage.set(message);
    this.confirmModalConfirmText.set(confirmText);
    this.pendingAction = action;
    this.isConfirmModalOpen.set(true);
  }

  onConfirmAction() {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.isConfirmModalOpen.set(false);
  }

  onCancelAction() {
    this.pendingAction = null;
    this.isConfirmModalOpen.set(false);
  }

  deleteGroup(groupId: string): void {
    this.openConfirmation(
      'Delete Group',
      'Are you sure you want to delete this group? This will permanently delete all its documents and vectors.',
      'Delete',
      () => {
        this.groupService.deleteGroup(groupId).subscribe({
          next: () => {
            this.selectedGroup.set(null);
            this.fetchUserGroups();
          },
          error: () => console.error('Failed to delete group.')
        });
      }
    );
  }

  onRequestDeleteDoc(docId: string): void {
    const selected = this.selectedGroup();
    if (!selected) return;

    this.openConfirmation(
      'Delete Document',
      'Are you sure you want to delete this document from the group? This cannot be undone.',
      'Delete',
      () => {
        this.documentService.deleteDocument(docId).subscribe({
          next: () => {
            if (this.documentManager) {
              this.documentManager.fetchGroupDocuments(selected.groupId);
            }
          },
          error: () => {
            if (this.documentManager) {
              this.documentManager.errorMessage.set('Failed to delete document.');
            }
          }
        });
      }
    );
  }

  onRequestKickMember(event: { userId: string; userEmail: string }): void {
    const selected = this.selectedGroup();
    if (!selected) return;

    this.openConfirmation(
      'Remove Collaborator',
      `Are you sure you want to remove ${event.userEmail} from this group?`,
      'Remove',
      () => {
        this.groupService.removeMember(selected.groupId, event.userId).subscribe({
          next: () => {
            if (this.memberManager) {
              this.memberManager.fetchGroupMembers(selected.groupId);
            }
          },
          error: () => {
            if (this.memberManager) {
              this.memberManager.memberErrorMessage.set(`Failed to remove collaborator ${event.userEmail}.`);
            }
          }
        });
      }
    );
  }
}

