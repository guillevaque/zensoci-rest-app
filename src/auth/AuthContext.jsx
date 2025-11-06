import { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  // user = {id, name, email, role: 'admin'|'user'}

  const login = async ({ email, password }) => {
    // VISUAL: acepta cualquier credencial, si termina en @admin pone rol admin
    const isAdmin = email?.toLowerCase()?.includes("@admin");
    const u = { id: "u1", name: "Zensoci Admin", email, role: isAdmin ? "admin" : "user" };
    setUser(u);
    navigate("/"); // al dashboard que ya tengas
  };

  const logout = () => {
    setUser(null);
    navigate("/login");
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
