 export interface UserDetails {
  user: {
    user_id: number;
    role?: 'admin' | 'resident';
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix_name?: string;
    gender?: {
      gender_id: number;
      gender: string;
    };
    birth_date?: string;
    age?: string | number;
    username?: string;
    contact_number?: string;
    address?: string;
    plate_number?: string;
    car_model?: string;
    car_color?: string;
    profile_picture?: string | null;
  };

    token?: string;
 }

 export interface LoginCredentialsErrorFields {
    username?: string[]
    password?: string[]
 }