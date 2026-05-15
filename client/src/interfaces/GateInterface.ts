export interface GateUser {
    user_id: number;
    role: 'admin' | 'resident';
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix_name?: string;
    gender?: { gender_id: number; gender: string };
    birth_date?: string;
    age?: number | string;
    username?: string;
    contact_number?: string;
    address?: string;
    plate_number?: string;
    car_model?: string;
    car_color?: string;
    profile_picture?: string | null;
}

export interface GateLog {
    gate_log_id: number;
    user_id?: number;
    plate_number: string;
    owner_name?: string;
    car_model?: string;
    car_color?: string;
    direction: 'IN' | 'OUT';
    status: 'authorized' | 'unauthorized';
    capture_image?: string | null;
    logged_at: string;
}

export interface DashboardOverview {
    gate_status: 'open' | 'closed';
    camera_status: 'online' | 'offline';
    sensor_status: 'online' | 'offline';
    camera_stream_url?: string;
    stats: {
        authorized_entries: number;
        unauthorized_attempts: number;
        total_residents: number;
        pending_update_requests: number;
        unread_notifications: number;
    };
    recent_logs: GateLog[];
}

export interface TrafficChart {
    period: string;
    labels: string[];
    authorized: number[];
    unauthorized: number[];
}

export interface NotificationItem {
    notification_id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export interface UpdateRequestItem {
    update_request_id: number;
    user_id: number;
    requested_changes: Record<string, string>;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes?: string;
    resident?: GateUser;
    created_at: string;
}

export interface ResidentRow extends GateUser {
    gender_id?: number;
}
