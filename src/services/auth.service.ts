import { http } from './http';

export type UserRole = 'admin' | 'manager' | 'staff' | 'member';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginUser = {
  id: number;
  name: string;
  role: string;
  status: string;
  color: string;
};

export const AuthService = {
  /** Get list of active non-admin users for the login screen */
  getUsers: (): Promise<LoginUser[]> =>
    http.get('/auth/users.php').then((res: any) =>
      Array.isArray(res) ? res : (res.users ?? res.data ?? [])
    ),

  /** PIN login — user selects their card, enters 4-digit PIN */
  loginPin: (userId: number, pin: string): Promise<{ user: AuthUser }> =>
    http.post('/auth/login.php', { user_id: userId, pin }),

  /** Email + password login (admin / fallback) */
  loginEmail: (email: string, password: string): Promise<{ user: AuthUser }> =>
    http.post('/auth/login.php', { email, password }),

  /** Returns the currently authenticated user or null */
  me: (): Promise<{ user: AuthUser | null }> =>
    http.get('/auth/me.php').then((res: any) =>
      res && 'user' in res ? res : { user: res ?? null }
    ),

  /** Destroys the session */
  logout: (): Promise<{ ok: true }> =>
    http.post('/auth/logout.php', {}),
};
