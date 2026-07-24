import { http } from './http';
import { type AppRole } from '../config/roles';

export type StaffUser = {
  id: number;
  name: string;
  email: string | null;
  role: AppRole;
  status: 'active' | 'inactive';
  color: string;
};

export type CreateUserData = {
  name: string;
  role: AppRole;
  pin: string;
  color: string;
  email?: string;
};

export type UpdateUserData = {
  id: number;
  name?: string;
  role?: AppRole;
  status?: 'active' | 'inactive';
  color?: string;
  email?: string;
};

export const PersonalService = {
  getAll: (): Promise<StaffUser[]> =>
    http.get('/personal/users.php').then((res: any) =>
      Array.isArray(res) ? res : (res.users ?? [])
    ),

  create: (data: CreateUserData): Promise<StaffUser> =>
    http.post('/personal/users.php', data),

  update: (data: UpdateUserData): Promise<StaffUser> =>
    http.put('/personal/users.php', data),

  resetPin: (id: number, pin: string): Promise<void> =>
    http.put('/personal/users.php', { id, pin }),

  remove: (id: number): Promise<void> =>
    http.delete(`/personal/users.php?id=${id}`),
};
