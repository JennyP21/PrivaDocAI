import { Component, inject, signal, computed, effect, ElementRef, ViewChild, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '../services/chat.service';
import { ReferenceChunk, ChatSessionResponse } from '../models';
import { marked } from 'marked';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="absolute inset-0 flex bg-slate-950 animate-fade-in">
      
      <!-- CHAT SESSIONS SIDEBAR -->
      <div class="w-64 bg-slate-900/30 border-r border-slate-900/60 flex flex-col justify-between h-full shrink-0">
        <div class="p-4 flex flex-col h-full min-h-0">
          
          <!-- New Chat Button -->
          <button
            (click)="createSession()"
            class="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/35 rounded-xl text-indigo-400 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mb-4 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
          
          <!-- Sessions List -->
          <div class="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin select-none">
            <div *ngIf="chatSessions().length === 0" class="text-slate-500 text-[10px] text-center py-6 px-2">
              No chat sessions yet.
            </div>
            
            <div
              *ngFor="let session of chatSessions()"
              class="group/sess w-full px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 border"
              [class.bg-slate-800/80]="activeSession()?.id === session.id"
              [class.border-slate-700/50]="activeSession()?.id === session.id"
              [class.text-slate-100]="activeSession()?.id === session.id"
              [class.font-medium]="activeSession()?.id === session.id"
              [class.bg-transparent]="activeSession()?.id !== session.id"
              [class.border-transparent]="activeSession()?.id !== session.id"
              [class.text-slate-400]="activeSession()?.id !== session.id"
              [class.hover:bg-slate-900/40]="activeSession()?.id !== session.id"
              [class.hover:text-slate-200]="activeSession()?.id !== session.id"
              (click)="selectSession(session)"
            >
              <!-- Inline rename input -->
              <div *ngIf="editingSessionId() === session.id" class="flex items-center gap-1 flex-1 min-w-0" (click)="$event.stopPropagation()">
                <input
                  type="text"
                  name="editingTitle"
                  [(ngModel)]="editingTitle"
                  (keydown.enter)="saveSessionTitle(session)"
                  (keydown.escape)="cancelEdit()"
                  class="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full"
                  autofocus
                />
                <button (click)="saveSessionTitle(session)" class="text-emerald-400 hover:text-emerald-350 p-0.5 cursor-pointer shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </button>
                <button (click)="cancelEdit()" class="text-rose-400 hover:text-rose-350 p-0.5 cursor-pointer shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Static title display -->
              <span *ngIf="editingSessionId() !== session.id" class="truncate text-xs pr-2 flex-1">{{ session.title }}</span>
              
              <!-- Action buttons -->
              <div *ngIf="editingSessionId() !== session.id" class="flex items-center gap-0.5 shrink-0">
                <button
                  (click)="startEdit($event, session)"
                  class="opacity-0 group-hover/sess:opacity-100 hover:text-indigo-400 p-1 rounded transition-all cursor-pointer"
                  title="Rename Chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
                <button
                  (click)="deleteSession($event, session.id)"
                  class="opacity-0 group-hover/sess:opacity-100 hover:text-rose-400 p-1 rounded transition-all cursor-pointer"
                  title="Delete Chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <!-- MAIN CHAT AREA -->
      <div class="flex-1 flex flex-col relative h-full min-w-0">
        
        <!-- Welcome state (no session selected) -->
        <div *ngIf="!activeSession()" class="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div class="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <h4 class="font-semibold text-slate-200 text-sm">Select or Create a Chat Session</h4>
          <p class="text-slate-400 text-xs max-w-xs leading-relaxed">Create a session in the left sidebar to start isolated contextual conversations with this group's documents.</p>
        </div>

        <!-- Chat Container -->
        <div *ngIf="activeSession()" class="flex-1 flex flex-col overflow-hidden h-full">
          
          <!-- Messages Scrollable Area -->
          <div #chatContainer class="flex-1 overflow-y-auto p-6 space-y-4">
            <div *ngIf="chatMessages().length === 0" class="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-3">
              <div class="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <h4 class="font-semibold text-slate-200">Secure Assistant Ready</h4>
              <p class="text-slate-400 text-xs leading-relaxed">Ask anything about the ingested documents in this group. All answers are strictly isolated and computed locally using <strong>Gemma:7b</strong> and <strong>nomic-embed-text</strong>.</p>
            </div>

            <!-- Message Bubbles -->
            <div
              *ngFor="let msg of chatMessages()"
              [class]="'flex flex-col ' + (msg.sender === 'user' ? 'items-end' : 'items-start')"
            >
              <div
                *ngIf="msg.text"
                [class]="'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed border ' + 
                  (msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none shadow-md shadow-indigo-600/10' 
                    : 'bg-slate-900 text-slate-200 border-slate-800/80 rounded-tl-none')"
              >
                <div class="markdown-content" [innerHTML]="msg.htmlText || msg.text"></div>
              </div>

              <!-- Reference Chunks / Sources Section -->
              <div *ngIf="msg.sender === 'ai' && msg.references && msg.references.length > 0" class="max-w-[75%] mt-1.5 space-y-1">
                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1">Retrieved Context:</p>
                <div class="flex flex-wrap gap-1">
                  <div *ngFor="let ref of msg.references; let refIdx = index" class="group/ref relative">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900/60 hover:bg-slate-800 border border-slate-850 hover:border-indigo-500/30 rounded-xl text-[10px] text-indigo-400 font-medium cursor-help transition-all duration-200 select-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 text-indigo-400">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      {{ ref.fileName }} [Chunk {{ refIdx + 1 }}]
                    </span>
                    
                    <!-- Tooltip for Chunk Content -->
                    <div class="absolute bottom-full left-0 pb-2 w-80 opacity-0 group-hover/ref:opacity-100 pointer-events-none group-hover/ref:pointer-events-auto transition-all duration-200 z-50">
                      <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl max-h-48 overflow-y-auto scrollbar-thin text-[11px] text-slate-350 leading-relaxed">
                        <p class="font-bold text-[10px] text-indigo-400 mb-1 flex items-center gap-1 select-none">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 text-indigo-500">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          Source: {{ ref.fileName }}
                        </p>
                        <p class="whitespace-pre-wrap font-sans bg-slate-900/50 p-2 rounded-lg border border-slate-900 text-slate-400 select-text">{{ ref.content }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div *ngIf="isChatting()" class="flex justify-start">
              <div class="bg-slate-900 border border-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
              </div>
            </div>
          </div>

          <!-- Input Bar -->
          <div class="p-4 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md">
            <form (ngSubmit)="sendChatMessage()" class="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                name="currentQuestion"
                [(ngModel)]="currentQuestion"
                [disabled]="isChatting()"
                class="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                placeholder="Ask a question about the group documents..."
                autocomplete="off"
              />
              <button
                type="submit"
                [disabled]="isChatting() || !currentQuestion.trim()"
                class="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/25 flex items-center justify-center cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
      
    </div>
  `,
  styles: `
    ::ng-deep .markdown-content {
      p {
        margin-bottom: 0.75rem;
      }
      p:last-child {
        margin-bottom: 0;
      }
      ul {
        list-style-type: disc;
        margin-left: 1.25rem;
        margin-bottom: 0.75rem;
      }
      ol {
        list-style-type: decimal;
        margin-left: 1.25rem;
        margin-bottom: 0.75rem;
      }
      li {
        margin-bottom: 0.25rem;
      }
      strong {
        font-weight: 700;
        color: #fff;
      }
      h1, h2, h3, h4, h5, h6 {
        font-weight: 700;
        color: #fff;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }
      h1 { font-size: 1.25rem; }
      h2 { font-size: 1.15rem; }
      h3 { font-size: 1.05rem; }
      code {
        background-color: #1e293b;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: monospace;
        font-size: 0.875rem;
      }
      pre {
        background-color: #0f172a;
        padding: 0.75rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin-bottom: 0.75rem;
        code {
          background-color: transparent;
          padding: 0;
        }
      }
    }
  `
})
export class ChatPanelComponent {
  groupId = input.required<string>();
  isSystemAdmin = input<boolean>(false);

  private chatService = inject(ChatService);
  private sanitizer = inject(DomSanitizer);
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  chatSessions = signal<ChatSessionResponse[]>([]);
  activeSession = signal<ChatSessionResponse | null>(null);
  chatMessages = signal<{ sender: 'user' | 'ai'; text: string; htmlText?: SafeHtml; references?: ReferenceChunk[] }[]>([]);
  currentQuestion = '';
  
  // Track which session IDs are currently streaming responses
  activeStreamingSessions = signal<Set<string>>(new Set());

  // Dynamically compute if the currently active session is chatting/generating
  isChatting = computed(() => {
    const active = this.activeSession();
    return active ? this.activeStreamingSessions().has(active.id) : false;
  });

  // Local cache to store messages for each chat session
  private sessionMessagesCache = new Map<string, { sender: 'user' | 'ai'; text: string; htmlText?: SafeHtml; references?: ReferenceChunk[] }[]>();

  editingSessionId = signal<string | null>(null);
  editingTitle = '';

  constructor() {
    // Clear and reload chat sessions when group ID changes
    effect(() => {
      const gId = this.groupId();
      this.chatSessions.set([]);
      this.activeSession.set(null);
      this.chatMessages.set([]);
      this.sessionMessagesCache.clear();
      this.activeStreamingSessions.set(new Set());
      if (gId) {
        this.loadChatSessions(gId);
      }
    });

    // Auto-scroll chat to the bottom when messages update
    effect(() => {
      const messages = this.chatMessages();
      if (messages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  loadChatSessions(groupId: string): void {
    this.chatService.getChatSessions(groupId).subscribe({
      next: (sessions) => {
        this.chatSessions.set(sessions);
        if (sessions.length > 0) {
          this.selectSession(sessions[0]);
        } else {
          this.createDefaultSession(groupId);
        }
      },
      error: (err) => {
        console.error('Failed to load chat sessions:', err);
      }
    });
  }

  createDefaultSession(groupId: string): void {
    this.chatService.createChatSession(groupId, 'General Chat').subscribe({
      next: (session) => {
        this.chatSessions.update(sess => [session, ...sess]);
        this.selectSession(session);
      },
      error: (err) => {
        console.error('Failed to create default session:', err);
      }
    });
  }

  createSession(): void {
    const gId = this.groupId();
    if (!gId) return;
    const sessionNum = this.chatSessions().length + 1;
    this.chatService.createChatSession(gId, `Chat Thread ${sessionNum}`).subscribe({
      next: (session) => {
        this.chatSessions.update(sess => [session, ...sess]);
        this.selectSession(session);
      },
      error: (err) => {
        console.error('Failed to create chat session:', err);
      }
    });
  }

  deleteSession(event: Event, sessionId: string): void {
    event.stopPropagation(); // Prevent selectSession
    this.chatService.deleteChatSession(sessionId).subscribe({
      next: () => {
        this.sessionMessagesCache.delete(sessionId);
        this.activeStreamingSessions.update(set => {
          const newSet = new Set(set);
          newSet.delete(sessionId);
          return newSet;
        });
        this.chatSessions.update(sess => sess.filter(s => s.id !== sessionId));
        if (this.activeSession()?.id === sessionId) {
          const remaining = this.chatSessions();
          if (remaining.length > 0) {
            this.selectSession(remaining[0]);
          } else {
            this.activeSession.set(null);
            this.chatMessages.set([]);
          }
        }
      },
      error: (err) => {
        console.error('Failed to delete chat session:', err);
      }
    });
  }

  startEdit(event: Event, session: ChatSessionResponse): void {
    event.stopPropagation();
    this.editingSessionId.set(session.id);
    this.editingTitle = session.title;
  }

  cancelEdit(): void {
    this.editingSessionId.set(null);
    this.editingTitle = '';
  }

  saveSessionTitle(session: ChatSessionResponse): void {
    const newTitle = this.editingTitle.trim();
    if (!newTitle || newTitle === session.title) {
      this.cancelEdit();
      return;
    }

    this.chatService.updateChatSession(session.id, newTitle).subscribe({
      next: (updatedSession) => {
        this.chatSessions.update(sess => sess.map(s => s.id === session.id ? updatedSession : s));
        if (this.activeSession()?.id === session.id) {
          this.activeSession.set(updatedSession);
        }
        this.cancelEdit();
      },
      error: (err) => {
        console.error('Failed to update session title:', err);
        this.cancelEdit();
      }
    });
  }

  selectSession(session: ChatSessionResponse): void {
    this.activeSession.set(session);
    if (this.sessionMessagesCache.has(session.id)) {
      this.chatMessages.set(this.sessionMessagesCache.get(session.id)!);
    } else {
      this.chatMessages.set([]);
      this.loadChatHistory(session.id);
    }
  }

  loadChatHistory(sessionId: string): void {
    this.chatService.getChatHistory(sessionId).subscribe({
      next: (history) => {
        const mapped = history.map(msg => ({
          sender: msg.sender as 'user' | 'ai',
          text: msg.text,
          htmlText: this.sanitizer.bypassSecurityTrustHtml(marked.parse(msg.text) as string),
          references: []
        }));
        this.sessionMessagesCache.set(sessionId, mapped);
        if (this.activeSession()?.id === sessionId) {
          this.chatMessages.set(mapped);
        }
      },
      error: (err) => {
        console.error('Failed to load chat history:', err);
      }
    });
  }

  sendChatMessage(): void {
    const session = this.activeSession();
    if (!session || !this.currentQuestion.trim()) return;

    const targetSessionId = session.id;
    const question = this.currentQuestion.trim();
    this.currentQuestion = '';

    // Push User Message
    const questionHtml = this.sanitizer.bypassSecurityTrustHtml(marked.parse(question) as string);
    const userMsg = { sender: 'user' as const, text: question, htmlText: questionHtml };

    // Get current messages from cache or initialize
    const msgs = [...(this.sessionMessagesCache.get(targetSessionId) || [])];
    msgs.push(userMsg);

    // Push empty AI message placeholder
    const aiMessageIndex = msgs.length;
    const aiMsg = { sender: 'ai' as const, text: '', htmlText: this.sanitizer.bypassSecurityTrustHtml(''), references: [] };
    msgs.push(aiMsg);

    // Update cache
    this.sessionMessagesCache.set(targetSessionId, msgs);

    // Update UI if still active
    if (this.activeSession()?.id === targetSessionId) {
      this.chatMessages.set([...msgs]);
    }

    // Set streaming active for this session
    this.activeStreamingSessions.update(set => {
      const newSet = new Set(set);
      newSet.add(targetSessionId);
      return newSet;
    });

    this.chatService.askQuestion(targetSessionId, question).subscribe({
      next: (response) => {
        const fullAnswerText = response.answer || '';
        const accumulatedReferences = response.references || [];
        const html = this.sanitizer.bypassSecurityTrustHtml(marked.parse(fullAnswerText) as string);

        // Update cached messages
        const currentMsgs = this.sessionMessagesCache.get(targetSessionId);
        if (currentMsgs && currentMsgs[aiMessageIndex]) {
          currentMsgs[aiMessageIndex] = {
            sender: 'ai',
            text: fullAnswerText,
            htmlText: html,
            references: accumulatedReferences
          };
          this.sessionMessagesCache.set(targetSessionId, currentMsgs);

          // Update UI if still active
          if (this.activeSession()?.id === targetSessionId) {
            this.chatMessages.set([...currentMsgs]);
          }
        }

        // Deactivate chatting state
        this.activeStreamingSessions.update(set => {
          const newSet = new Set(set);
          newSet.delete(targetSessionId);
          return newSet;
        });
      },
      error: (err) => {
        this.activeStreamingSessions.update(set => {
          const newSet = new Set(set);
          newSet.delete(targetSessionId);
          return newSet;
        });
        console.error('Chat error:', err);
        const errMsg = err.message || 'Error occurred while querying the secure vector database.';
        const errHtml = this.sanitizer.bypassSecurityTrustHtml(marked.parse(`Failed to answer: ${errMsg}`) as string);

        const currentMsgs = this.sessionMessagesCache.get(targetSessionId);
        if (currentMsgs && currentMsgs[aiMessageIndex]) {
          currentMsgs[aiMessageIndex] = {
            sender: 'ai',
            text: `Failed to answer: ${errMsg}`,
            htmlText: errHtml,
            references: []
          };
          this.sessionMessagesCache.set(targetSessionId, currentMsgs);

          if (this.activeSession()?.id === targetSessionId) {
            this.chatMessages.set([...currentMsgs]);
          }
        }
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
