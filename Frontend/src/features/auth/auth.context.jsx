import { useState, useEffect, useCallback } from "react";
import { getMe } from "./services/auth.api";
import { AuthContext } from "./auth.context.definition";

// React StrictMode intentionally re-runs effects in development. Keep one
// in-flight auth check so a mount/focus/visibility event cannot create a burst
// of identical /api/auth/get-me requests.
let authCheckPromise = null;
let authCheckAt = 0;
const AUTH_CHECK_CACHE_MS = 1500;

const checkCurrentUser = async () => {
    const now = Date.now();
    if (authCheckPromise) return authCheckPromise;
    if (now - authCheckAt < AUTH_CHECK_CACHE_MS) return null;

    authCheckPromise = getMe()
        .then((data) => data?.user || null)
        .catch(() => null)
        .finally(() => {
            authCheckAt = Date.now();
            authCheckPromise = null;
        });

    return authCheckPromise;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const currentUser = await checkCurrentUser();
        if (currentUser !== null) setUser(currentUser);
    }, []);

    useEffect(() => {
        let mounted = true;

        checkCurrentUser().then((currentUser) => {
            if (mounted) setUser(currentUser);
        }).finally(() => {
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
        };
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
