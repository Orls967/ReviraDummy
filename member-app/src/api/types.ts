export interface PlanSummary {
  id: number;
  name: string;
  duration_days: number;
}

export interface MembershipPlan extends PlanSummary {
  price: number;
  description: string | null;
  is_active: boolean;
}

export interface MembershipSummary {
  status: string;
  is_active: boolean;
  has_pending_application: boolean;
  plan: PlanSummary | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Me {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  role: 'admin' | 'member';
  membership: MembershipSummary | null;
}

export interface AuthSession {
  token: string;
  token_type: 'Bearer';
  user: Me;
}

export type PaymentMethod = 'transfer' | 'on_the_spot';

export interface TransactionSummary {
  id: number;
  amount: number;
  payment_method: PaymentMethod;
  verification_status: string;
  reject_reason: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface Membership {
  id: number;
  record_type: 'registration' | 'extension';
  status: string;
  start_date: string;
  end_date: string | null;
  plan: PlanSummary;
  transaction: TransactionSummary | null;
  created_at: string;
}

export interface MembershipApplication {
  membership_plan_id: number;
  start_date: string;
  payment_method: PaymentMethod;
}

export interface ClassSchedule {
  id: number;
  class: { id: number; name: string; description: string | null };
  instructor: { id: number; name: string };
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: string;
  display_status: string;
  cancel_reason: string | null;
  participants_count: number;
  min_participants: number;
  is_booked?: boolean;
}

export interface DataResponse<T> {
  data: T;
}
