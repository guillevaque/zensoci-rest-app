// src/api/auth.ts
import { http } from './http'

export type UserRole = 'admin'|'manager'|'staff'
export type User = { id:number; name:string; email:string; role:UserRole; created_at?:string }

export const AuthAPI = {
  me:     () => http.get('/auth/me.php') as Promise<{ user: User|null }>,
  login:  (email:string, password:string) =>
             http.send('POST','/auth/login.php', { email, password }) as Promise<{ user: User }>,
  logout: () => http.send('POST','/auth/logout.php', {}) as Promise<{ ok:true }>,
}
