import AxiosInstance from "./AxiosInstance";

interface LoginData {
  username: string;
  password: string;
}

interface AdmissionRegisterData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: string;
  birth_date: string;
  email: string;
  username?: string;
  password?: string;
  password_confirmation?: string;
  contact_number?: string;
  address?: string;
  plate_number?: string;
  car_model?: string;
  car_color?: string;
}

const AuthService = {
  login: async (data: LoginData) => {
    const response = await AxiosInstance.post("/auth/login", data);
    return response;
  },
  securityGuardRegister: async (data: AdmissionRegisterData) => {
    const response = await AxiosInstance.post("/auth/security-guard/register", data);
    return response;
  },
  residentRegister: async (data: AdmissionRegisterData) => {
    const response = await AxiosInstance.post("/auth/resident/register", data);
    return response;
  },
  logout: async () => {
    const response = await AxiosInstance.post("/auth/logout");
    return response;
  },
  me: async () => {
    const response = await AxiosInstance.get("/auth/me");
    return response;
  },
};

export default AuthService;