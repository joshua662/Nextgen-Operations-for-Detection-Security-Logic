export type UserRole = "admin" | "resident";

export type AdmissionRegistrationForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    gender: string;
    birth_date: string;
    email: string;
    role: string;
};

export type IssuedCredentials = {
    username: string;
    email: string;
    password: string;
    role: string;
};

export const emptyAdmissionForm = (): AdmissionRegistrationForm => ({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    email: "",
    role: "",
});

/** @deprecated Use AdmissionRegistrationForm for the admission modal */
export type ResidentRegistrationForm = AdmissionRegistrationForm & {
    password: string;
    password_confirmation: string;
    contact_number: string;
    address: string;
    plate_number: string;
    car_model: string;
    car_color: string;
};

/** @deprecated Use AdmissionRegistrationForm for the admission modal */
export type AdminRegistrationForm = AdmissionRegistrationForm & {
    password: string;
    password_confirmation: string;
};

export const emptyResidentForm = (): ResidentRegistrationForm => ({
    ...emptyAdmissionForm(),
    password: "",
    password_confirmation: "",
    contact_number: "",
    address: "",
    plate_number: "",
    car_model: "",
    car_color: "",
});

export const emptyAdminForm = (): AdminRegistrationForm => ({
    ...emptyAdmissionForm(),
    password: "",
    password_confirmation: "",
});
