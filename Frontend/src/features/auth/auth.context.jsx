import { useState, useEffect, useCallback } from "react";
import { getMe } from "./services/auth.api";
import { AuthContext } from "./auth.context.definition";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const data = await getMe();
            if (data?.user) setUser(data.user);
            else setUser(null);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await getMe();
                if (data?.user) setUser(data.user);
                else setUser(null);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") refreshUser();
        };
        const handleFocus = () => refreshUser();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
        };
    }, [refreshUser]);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
