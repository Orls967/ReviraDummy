export type UserRole = 'admin' | 'member';

export interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  token_type: 'Bearer';
  user: User;
}

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

export interface MembershipPlanInput {
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: boolean;
}

export interface MemberContact {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
}

export interface AdminMember extends MemberContact {
  membership_status: string;
  plan: PlanSummary | null;
  start_date: string | null;
  end_date: string | null;
  registered_at: string;
}

export interface Membership {
  id: number;
  record_type: 'registration' | 'extension';
  status: string;
  start_date: string;
  end_date: string | null;
  plan: PlanSummary;
  created_at: string;
}

export type PaymentMethod = 'transfer' | 'on_the_spot';
export type TransactionStatus = 'pending' | 'verified' | 'rejected';

export interface AdminTransaction {
  id: number;
  amount: number;
  payment_method: PaymentMethod;
  verification_status: string;
  reject_reason: string | null;
  verified_at: string | null;
  created_at: string;
  member: MemberContact;
  membership: Membership;
}

export interface Participant {
  id: number;
  booked_at: string;
  member: MemberContact;
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
  participants?: Participant[];
}

export interface ClassScheduleInput {
  gym_class_id: number;
  instructor_id: number;
  schedule_date: string;
  start_time: string;
  end_time: string;
}

export type ScheduleStatusChange =
  | { status: 'ongoing' | 'completed' }
  | { status: 'cancelled'; cancel_reason: string };

export interface GymClass {
  id: number;
  name: string;
  description: string | null;
  min_participants: number;
  default_instructor_id: number | null;
}

export interface Instructor {
  id: number;
  name: string;
  specialization: string | null;
}

export interface DataResponse<T> {
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
