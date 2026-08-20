import React, { useState } from "react"
import "../auth.form.scss"
import { Link } from 'react-router'
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router"

const Login = () => {
    const navigate = useNavigate()
    const { loading, handleLogin } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        try {
            await handleLogin({ email, password })
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Login failed")
        }
    }

    if (loading) {
        return (<main><h1>Loading.....</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>

                {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input onChange={(e) => { setEmail(e.target.value) }} type="email" id="email" name="email" placeholder='Enter email address'></input>

                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input onChange={(e) => { setPassword(e.target.value) }} type="password" id="password" name="password" placeholder='Enter password' />
                    </div>
                    <button className="button primary-button">Login</button>


                </form>


                <p>Dont have an account? <Link to={"/register"}>Register</Link></p>
            </div>
        </main>
    )
}

export default Login
