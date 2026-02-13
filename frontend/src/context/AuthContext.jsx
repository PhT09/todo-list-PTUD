import { createContext, useState, useEffect, useContext } from "react";
import { todoApi } from "../api/todoApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Sync token to localStorage & Axios header
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
            todoApi.setAuthToken(token);
            // Fetch user profile
            todoApi.getMe()
                .then((res) => setUser(res.data))
                .catch(() => { setToken(null); setUser(null); })
                .finally(() => setIsLoading(false));
        } else {
            localStorage.removeItem("token");
            todoApi.setAuthToken(null);
            setUser(null);
            setIsLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        // OAuth2 requires x-www-form-urlencoded with 'username' field
        const params = new URLSearchParams();
        params.append("username", email);
        params.append("password", password);

        const res = await todoApi.login(params);
        const newToken = res.data.access_token;

        // Critical Fix: Set header IMMEDIATELY before React re-renders children
        todoApi.setAuthToken(newToken);
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const register = async (email, password) => {
        await todoApi.register({ email, password });
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
