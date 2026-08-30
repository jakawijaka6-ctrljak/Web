export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
}

export interface Template {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export interface DeviceState {
  status: SessionStatus;
  qrDataUrl: string | null;
  phoneNumber: string | null;
}

export interface MessageRecord {
  id: string;
  status: "PENDING" | "SENT" | "FAILED";
  cost: number;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  template: { title: string };
  phoneNumber: { number: string };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
  session: { status: SessionStatus; phoneNumber: string | null } | null;
}

export interface AdminStats {
  totalUsers: number;
  totalMessagesSent: number;
  totalRevenue: number;
  numbersAvailable: number;
  numbersUsed: number;
}

export interface PhoneNumberRecord {
  id: string;
  number: string;
  status: "AVAILABLE" | "USED";
  batchLabel: string | null;
  createdAt: string;
}
