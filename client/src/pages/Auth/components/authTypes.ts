export type UserRole = "admin" | "resident";

export type ResidentRegistrationForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    gender: string;
    birth_date: string;
    email: string;
    role: string;
    password: string;
    password_confirmation: string;
    contact_number: string;
    address: string;
    plate_number: string;
    car_model: string;
    car_color: string;
};

export type AdminRegistrationForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    gender: string;
    birth_date: string;
    email: string;
    role: string;
    password: string;
    password_confirmation: string;
};

export const emptyResidentForm = (): ResidentRegistrationForm => ({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    email: "",
    role: "",
    password: "",
    password_confirmation: "",
    contact_number: "",
    address: "",
    plate_number: "",
    car_model: "",
    car_color: "",
});

export const emptyAdminForm = (): AdminRegistrationForm => ({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    email: "",
    role: "",
    password: "",
    password_confirmation: "",
});
