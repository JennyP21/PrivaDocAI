import { Component, inject, signal, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../services/group.service';
import { GroupMemberResponse } from '../models';

@Component({
  selector: 'app-member-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="absolute inset-0 overflow-y-auto p-6 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Column: List of Members -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="font-bold text-slate-300">Group Members</h3>
          <div class="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th class="px-5 py-3.5">Email</th>
                  <th class="px-5 py-3.5">Role</th>
                  <th class="px-5 py-3.5 text-right" *ngIf="isCurrentGroupOwner()">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr *ngFor="let member of members()" class="hover:bg-slate-800/20 transition-all">
                  <td class="px-5 py-4">
                    <span class="font-medium text-slate-300">{{ member.userEmail }}</span>
                  </td>
                  <td class="px-5 py-4">
                    <span [class]="'text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ' + 
                      (member.groupRole === 'OWNER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700')">
                      {{ member.groupRole }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right space-x-2" *ngIf="isCurrentGroupOwner() && member.userId !== currentUserId()">
                    <!-- Change Role Button -->
                    <button
                      (click)="toggleRole(member)"
                      class="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 bg-slate-950/40 hover:bg-slate-950 transition-all cursor-pointer"
                    >
                      Set as {{ member.groupRole === 'OWNER' ? 'MEMBER' : 'OWNER' }}
                    </button>
                    
                    <!-- Kick Button -->
                    <button
                      (click)="onRemoveMember(member)"
                      class="p-1.5 rounded-lg bg-slate-950/40 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800/40 hover:border-rose-900 transition-all text-slate-500 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Column: Add Member -->
        <div class="space-y-4" *ngIf="isCurrentGroupOwner()">
          <h3 class="font-bold text-slate-300">Invite Member</h3>
          <div class="backdrop-blur-xl bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div *ngIf="memberSuccessMessage()" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
              {{ memberSuccessMessage() }}
            </div>
            <div *ngIf="memberErrorMessage()" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
              {{ memberErrorMessage() }}
            </div>

            <form (ngSubmit)="inviteMember()" class="space-y-4">
              <div>
                <label class="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Member Email</label>
                <input
                  type="email"
                  name="newMemberEmail"
                  required
                  [(ngModel)]="newMemberEmail"
                  class="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                  placeholder="collaborator@example.com"
                />
              </div>

              <div>
                <label class="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Role</label>
                <select
                  name="newMemberRole"
                  [(ngModel)]="newMemberRole"
                  class="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="MEMBER">Member</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <button
                type="submit"
                [disabled]="isInviting() || !newMemberEmail.trim()"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <svg *ngIf="isInviting()" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Add to Group
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  `
})
export class MemberManagerComponent {
  groupId = input.required<string>();
  isSystemAdmin = input<boolean>(false);
  userRole = input<'OWNER' | 'MEMBER'>('MEMBER');
  currentUserId = input<string>('');

  kickRequest = output<{ userId: string; userEmail: string }>();

  private groupService = inject(GroupService);

  members = signal<GroupMemberResponse[]>([]);
  newMemberEmail = '';
  newMemberRole: 'OWNER' | 'MEMBER' = 'MEMBER';

  isInviting = signal(false);
  memberSuccessMessage = signal('');
  memberErrorMessage = signal('');

  constructor() {
    // Re-fetch members list whenever groupId changes
    effect(() => {
      const gId = this.groupId();
      if (gId) {
        this.newMemberEmail = '';
        this.memberSuccessMessage.set('');
        this.memberErrorMessage.set('');
        this.fetchGroupMembers(gId);
      }
    });
  }

  isCurrentGroupOwner(): boolean {
    return this.userRole() === 'OWNER' || this.isSystemAdmin();
  }

  fetchGroupMembers(groupId: string): void {
    this.groupService.getMembersByGroup(groupId).subscribe({
      next: (members) => this.members.set(members),
      error: () => console.error('Failed to load group members.')
    });
  }

  toggleRole(member: GroupMemberResponse): void {
    const gId = this.groupId();
    if (!gId) return;

    this.memberSuccessMessage.set('');
    this.memberErrorMessage.set('');
    const nextRole = member.groupRole === 'OWNER' ? 'MEMBER' : 'OWNER';
    
    this.groupService.changeMemberRole(gId, member.userId, nextRole).subscribe({
      next: () => {
        this.fetchGroupMembers(gId);
        this.memberSuccessMessage.set(`Successfully set role for ${member.userEmail} to ${nextRole}.`);
      },
      error: () => {
        this.memberErrorMessage.set(`Failed to change role for ${member.userEmail}.`);
      }
    });
  }

  inviteMember(): void {
    const gId = this.groupId();
    if (!gId || !this.newMemberEmail.trim()) return;

    this.isInviting.set(true);
    this.memberSuccessMessage.set('');
    this.memberErrorMessage.set('');

    this.groupService.findUserByEmail(this.newMemberEmail).subscribe({
      next: (user) => {
        this.groupService.addMember(gId, user.id, this.newMemberRole).subscribe({
          next: () => {
            this.isInviting.set(false);
            this.memberSuccessMessage.set(`Successfully added ${this.newMemberEmail} to the group!`);
            this.newMemberEmail = '';
            this.fetchGroupMembers(gId);
          },
          error: (err) => {
            this.isInviting.set(false);
            this.memberErrorMessage.set(err.error?.message || 'Failed to add member to the group.');
          }
        });
      },
      error: () => {
        this.isInviting.set(false);
        this.memberErrorMessage.set('User with this email not found.');
      }
    });
  }

  onRemoveMember(member: GroupMemberResponse): void {
    this.kickRequest.emit({ userId: member.userId, userEmail: member.userEmail });
  }
}
