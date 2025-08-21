import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GrpcAttendanceService } from './grpc-attendance.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="p-4">
      <h1>Attendance Stream (gRPC-Web)</h1>
      <div class="controls">
        <input type="text" placeholder="location (optional)" [(ngModel)]="location" />
        <button (click)="start()">Start Stream</button>
        <button (click)="stop()" [disabled]="!active()">Stop</button>
        <button (click)="sendDemo()">Send Demo Scan</button>
      </div>
      <ul class="snapshots">
        <li *ngFor="let s of snapshots()">
          <strong>{{ s.attendeeId }}</strong>
          <span> @ {{ s.lastSeenLocation }} </span>
          <small>{{ s.lastSeenUnixMs }}</small>
        </li>
      </ul>
      <h2>Recent Acknowledgements</h2>
      <ul class="acks">
        <li *ngFor="let ack of acks()">
          <strong>{{ ack.scanId }}</strong>
          <span> - {{ ack.status }}</span>
          <small>{{ ack.timestampUnixMs }}</small>
        </li>
      </ul>
    </main>
  `,
  styles: [`.controls{display:flex;gap:.5rem;align-items:center;margin:.5rem 0}.snapshots{margin-top:1rem;padding-left:1rem}.acks{margin-top:1rem;padding-left:1rem}`]
})
export class App implements OnDestroy {
  location = '';
  private sub?: Subscription;
  snapshots = signal<any[]>([]);
  active = signal(false);
  acks = signal<any[]>([]);

  constructor(private api: GrpcAttendanceService) { }

  start() {
    this.stop();
    this.active.set(true);
    this.sub = this.api.watchAttendance(this.location).subscribe({
      next: s => this.snapshots.update(arr => [s, ...arr].slice(0, 100)),
      error: err => { console.error(err); this.active.set(false); }
    });
  }

  stop() {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.active.set(false);
  }

  async sendDemo() {
    const now = Date.now();
    try {
      const ack = await this.api.recordScan({
        deviceId: 'browser-dev',
        attendeeId: 'A-' + Math.floor(Math.random() * 1000),
        // int64 -> use BigInt in TS
        timestampUnixMs: BigInt(now),
        location: this.location || 'Gate-1',
        meta: 'demo'
      } as any);
      console.log('ack', ack);
      this.acks.update(arr => [ack, ...arr].slice(0, 100));
    } catch (e) {
      console.error(e);
    }
  }

  ngOnDestroy() { this.stop(); }
}
