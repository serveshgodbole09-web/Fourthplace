import { createContext, useContext, useMemo, useState } from "react";
import { AuthStore } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => AuthStore.customer());
  const [admin, setAdmin] = useState(() => AuthStore.admin());

  const value = useMemo(
    () => ({
      customer,
      admin,
      loginCustomer(token, profile) {
        AuthStore.setCustomer(token, profile);
        setCustomer(profile);
      },
      loginAdmin(token, profile) {
        AuthStore.setAdmin(token, profile);
        setAdmin(profile);
      },
      logoutCustomer() {
        AuthStore.clearCustomer();
        setCustomer(null);
      },
      logoutAdmin() {
        AuthStore.clearAdmin();
        setAdmin(null);
      },
    }),
    [customer, admin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
