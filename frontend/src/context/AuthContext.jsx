
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(null);

    // Set token to axios defaults
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
            axios.defaults.headers.common["Authorization"] = "Bearer " + token;
            // Fetch User ???
        } else {
            localStorage.removeItem("token");
            delete axios.defaults.headers.common["Authorization"];
            setUser(null);
        }
    }, [token]);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);

        try {
            const res = await axios.post("/api/v1/auth/login", formData);
            setToken(res.data.access_token);
        } catch (err) {
            throw err;
        }
    };

    const register = async (email, password) => {
        await axios.post("/api/v1/auth/register", { email, password });
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, register, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
};
