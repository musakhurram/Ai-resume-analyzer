import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";

const Home = () => {
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        try {
            await handleLogout();
            navigate("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
            <h1>Welcome to Home Page</h1>
            {user && (
                <p>Logged in as: <strong>{user.username}</strong> ({user.email})</p>
            )}
            <button className="button primary-button" onClick={onLogout}>
                Logout
            </button>
        </main>
    );
};

export default Home;
