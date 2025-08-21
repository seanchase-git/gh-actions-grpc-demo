// grpc-attendance.service.ts
import { Injectable } from '@angular/core';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { AttendanceClient } from '../proto/attendance.client';
import { AttendanceRequest, ScanEvent } from '../proto/attendance';
import { PartialMessage } from '@protobuf-ts/runtime';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GrpcAttendanceService {
  private transport = new GrpcWebFetchTransport({ 
    baseUrl: 'http://localhost:5018'
  });
  private client = new AttendanceClient(this.transport);

  recordScan(scan: PartialMessage<ScanEvent>) {
    const msg = ScanEvent.create({
      deviceId: '',
      attendeeId: '',
      timestampUnixMs: 0n,  // bigint default for int64
      location: '',
      meta: '',
      ...scan
    });
    return this.client.recordScan(msg).response; // Promise<ScanAck>
  }

  watchAttendance(location?: string): Observable<any> {
    const req: AttendanceRequest = { location: location ?? '' };
    const call = this.client.getAttendance(req);
    return from(call.responses);
  }
}
