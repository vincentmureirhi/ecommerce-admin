import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const RouteCustomerAuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const ROUTE_CUSTOMER_TOKEN_KEY = "routeCustomerToken";
const ROUTE_CUSTOMER_USER_KEY = "routeCustomerUser";
const ROUTE_CUSTOMER_ACCOUNT_KEY = "routeCustomerAccount";

/* legacy fallback key from earlier code */
const ROUTE_CUSTOMER_PROFILE_KEY = "routeCustomerProfile";

function safeParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function RouteCustomerAuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [routeCustomerToken, setRouteCustomerToken] = useState(null);
  const [routeCustomerUser, setRouteCustomerUser] = useState(null);
  const [routeCustomerAccount, setRouteCustomerAccountState] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem(ROUTE_CUSTOMER_TOKEN_KEY);
      const userRaw =
        localStorage.getItem(ROUTE_CUSTOMER_USER_KEY) ||
        localStorage.getItem(ROUTE_CUSTOMER_PROFILE_KEY);
      const accountRaw = localStorage.getItem(ROUTE_CUSTOMER_ACCOUNT_KEY);

      const parsedUser = safeParse(userRaw);
      const parsedAccount = safeParse(accountRaw);

      setRouteCustomerToken(token || null);
      setRouteCustomerUser(parsedUser || null);
      setRouteCustomerAccountState(parsedAccount || null);

      if (parsedUser) {
        localStorage.setItem(ROUTE_CUSTOMER_USER_KEY, JSON.stringify(parsedUser));
        localStorage.setItem(ROUTE_CUSTOMER_PROFILE_KEY, JSON.stringify(parsedUser));
      }
    } catch (err) {
      console.error("❌ RouteCustomerAuthContext init error:", err);
      localStorage.removeItem(ROUTE_CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(ROUTE_CUSTOMER_USER_KEY);
      localStorage.removeItem(ROUTE_CUSTOMER_ACCOUNT_KEY);
      localStorage.removeItem(ROUTE_CUSTOMER_PROFILE_KEY);

      setRouteCustomerToken(null);
      setRouteCustomerUser(null);
      setRouteCustomerAccountState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function setSession({ token, customer, account }) {
    setRouteCustomerToken(token || null);
    setRouteCustomerUser(customer || null);
    setRouteCustomerAccountState(account || null);

    if (token) {
      localStorage.setItem(ROUTE_CUSTOMER_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ROUTE_CUSTOMER_TOKEN_KEY);
    }

    if (customer) {
      const serializedCustomer = JSON.stringify(customer);
      localStorage.setItem(ROUTE_CUSTOMER_USER_KEY, serializedCustomer);
      localStorage.setItem(ROUTE_CUSTOMER_PROFILE_KEY, serializedCustomer);
    } else {
      localStorage.removeItem(ROUTE_CUSTOMER_USER_KEY);
      localStorage.removeItem(ROUTE_CUSTOMER_PROFILE_KEY);
    }

    if (account) {
      localStorage.setItem(ROUTE_CUSTOMER_ACCOUNT_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(ROUTE_CUSTOMER_ACCOUNT_KEY);
    }
  }

  function setRouteCustomerAccount(account) {
    setRouteCustomerAccountState(account || null);

    if (account) {
      localStorage.setItem(ROUTE_CUSTOMER_ACCOUNT_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(ROUTE_CUSTOMER_ACCOUNT_KEY);
    }
  }

  async function login(username, password) {
    const response = await fetch(`${API_BASE}/route-customer-portal/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: String(username || "").trim(),
        password: String(password || ""),
      }),
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message || data?.error || "Route customer login failed."
      );
    }

    const token = data?.data?.token || null;
    const customer = data?.data?.customer || null;
    const account = data?.data?.account || null;

    if (!token || !customer) {
      throw new Error("Login succeeded but customer session data is incomplete.");
    }

    setSession({
      token,
      customer,
      account,
    });

    return data;
  }

  function logoutRouteCustomer() {
    setRouteCustomerToken(null);
    setRouteCustomerUser(null);
    setRouteCustomerAccountState(null);

    localStorage.removeItem(ROUTE_CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(ROUTE_CUSTOMER_USER_KEY);
    localStorage.removeItem(ROUTE_CUSTOMER_ACCOUNT_KEY);
    localStorage.removeItem(ROUTE_CUSTOMER_PROFILE_KEY);
  }

  /* alias so pages can use routeAuth.logout() safely */
  function logout() {
    logoutRouteCustomer();
  }

  const value = useMemo(
    () => ({
      loading,
      routeCustomerToken,
      routeCustomerUser,
      routeCustomerAccount,
      isRouteCustomerAuthed: Boolean(routeCustomerToken && routeCustomerUser),
      setSession,
      setRouteCustomerAccount,
      login,
      logout,
      logoutRouteCustomer,
    }),
    [loading, routeCustomerToken, routeCustomerUser, routeCustomerAccount]
  );

  return (
    <RouteCustomerAuthContext.Provider value={value}>
      {children}
    </RouteCustomerAuthContext.Provider>
  );
}

export function useRouteCustomerAuth() {
  const ctx = useContext(RouteCustomerAuthContext);

  if (!ctx) {
    throw new Error("useRouteCustomerAuth must be used within RouteCustomerAuthProvider");
  }

  return ctx;
}