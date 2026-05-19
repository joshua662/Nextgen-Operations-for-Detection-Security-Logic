export interface ActivityLogUser {
  user_id: number;
  username: string | null;
  first_name: string;
  last_name: string;
  role: string | null;
}

export interface ActivityLog {
  activity_log_id: number;
  user_id: number | null;
  username_attempted: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
  user?: ActivityLogUser | null;
}
