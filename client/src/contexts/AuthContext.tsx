import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from "react";
import type { UserDetails } from "../interfaces/AuthInterface";
import AuthService from "../services/AuthService";
import GateAccessService from "../services/GateAccessService";

interface AuthContextType {
  user: UserDetails | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  adminRegister: (data: Record<string, unknown>) => Promise<void>;
  residentLogin: (credentials: Record<string, string>) => Promise<void>;
  residentRegister: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isResident: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (username: string, password: string) => {
    const res = await AuthService.login({ username, password });
    if (res.status === 200) {
      localStorage.setItem("token", res.data.token);
      setUser(res.data);
      return;
    }
    throw new Error("Login failed.");
  };

  const adminRegister = async (data: Record<string, unknown>) => {
    const res = await AuthService.adminRegister(data as unknown as Parameters<typeof AuthService.adminRegister>[0]);
    if (res.status === 200 || res.status === 201) {
      localStorage.setItem("token", res.data.token);
      setUser({ user: res.data.user, token: res.data.token });
      return;
    }
    throw new Error("Registration failed.");
  };

  const residentLogin = async (credentials: Record<string, string>) => {
    const res = await GateAccessService.residentLogin(credentials);
    if (res.status === 200) {
      localStorage.setItem("token", res.data.token);
      setUser(res.data);
      return;
    }
    throw new Error("Login failed.");
  };

  const residentRegister = async (data: Record<string, unknown>) => {
    const res = await GateAccessService.residentRegister(data);
    if (res.status === 200 || res.status === 201) {
      localStorage.setItem("token", res.data.token);
      setUser({ user: res.data.user, token: res.data.token });
      return;
    }
    throw new Error("Registration failed.");
  };

  const logout = async () => {
    try {
      const res = await AuthService.logout();

      if (res.status === 200) {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        console.error("Unexpected status error during logging user out: ", res.status);
      }
    } catch (error) {
      console.error("Unexpected server error occured during logging user out: ", error);
      throw error;
    }
  };

  const checkAuth = async () => {
    setLoading(true);

    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await AuthService.me();

        if (res.status === 200) {
          setUser(res.data);
        } else {
          localStorage.removeItem("token");
          setUser(null);
          console.error("Unexpected status error occured during checking authentication: ", res.status);
        }
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
        console.error("Unexpected server error occured during checking authentication: ", error);
      }
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }

  };

  useEffect(() => {
    queueMicrotask(() => void checkAuth());
  }, []);

  const role = user?.user?.role === 'resident' ? 'resident' : 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      adminRegister,
      residentLogin,
      residentRegister,
      logout,
      isAdmin: role === 'admin',
      isResident: role === 'resident',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => { // eslint-disable-line react-refresh/only-export-components
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;