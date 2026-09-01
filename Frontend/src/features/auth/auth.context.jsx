import { useState, useEffect, useCallback } from "react";
import { getMe } from "./services/auth.api";
import { AuthContext } from "./auth.context.definition";

// Keep auth checks deduplicated, but invalidate any check that started before
// a login/register/Google-login/logout changed the authentication state.
let authCheckPromise = null;
let authCheckVersion = 0;

export const invalidateAuthCheck = () => {
    authCheckVersion += 1;
    authCheckPromise = null;
};

const checkCurrentUser = async () => {
    // There is no point calling a protected endpoint when there is no token.
    // This also keeps a normal logged-out state out of the console as an error.
    if (!localStorage.getItem("ra_auth_token")) return null;

    if (authCheckPromise) return authCheckPromise;

    const versionAtStart = authCheckVersion;
    authCheckPromise = getMe()
        .then((data) => {
            if (versionAtStart !== authCheckVersion) return null;
            return data?.user || null;
        })
        .catch(() => null)
        .finally(() => {
            if (versionAtStart === authCheckVersion) {
                authCheckPromise = null;
            }
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
            if (mounted && currentUser !== null) setUser(currentUser);
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
