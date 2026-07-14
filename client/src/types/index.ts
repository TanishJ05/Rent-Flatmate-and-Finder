export type UserRole = "tenant" | "owner" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
}
