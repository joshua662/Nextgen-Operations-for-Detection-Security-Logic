import AxiosInstance from "./AxiosInstance";

interface LoginData {
  username: string;
  password: string;
}

interface AdminRegisterData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: string;
  birth_date: string;
  username: string;
  password: string;
  password_confirmation: string;
}

const AuthService = {
  login: async (data: LoginData) => {
    const response = await AxiosInstance.post("/auth/login", data);
    return response;
  },
  adminRegister: async (data: AdminRegisterData) => {
    const response = await AxiosInstance.post("/auth/admin/register", data);
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