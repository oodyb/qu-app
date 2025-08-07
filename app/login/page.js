"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import "../styles/login.css"

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });
    if (result.error) {
      toast("Login failed. Please check your credentials.");
    } else {
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role === "ADMIN") {
        router.push("/admin");
      } else if (session.user.role === "INSTRUCTOR") {
        router.push("/instructor");
      } else if (session.user.role === "STUDENT") {
        router.push("/student");
      }
    }
  }, [session, status, router]);

  return (
    <>
      <div className="login">
        <header>
        </header>
        <main>
          <div className="login-wrapper">
            <div className="logo-title">
              <div className="logo-img">
                <img src="images/qu-logo.png" alt="Qatar University logo" />
              </div>
              <h1>
                QU <span>Student Management</span>
              </h1>
            </div>

            <blockquote className="login-quote">
              “Education is the most powerful weapon which you can use to change the world.”
              <br />
              <span>- Nelson Mandela</span>
            </blockquote>

            <div className="login-container">
              <form onSubmit={handleSubmit} className="login-form" id="login-Form">
                <h2>Welcome</h2>

                <div className="input-group">
                  <label htmlFor="username">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="input-user-username"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="input-user-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="login-btns">
                  <button type="submit" className="login-btn">
                    Login
                  </button>
                  <button
                    type="button"
                    className="login-btn"
                    onClick={() => signIn('google', { callbackUrl: "/" })}
                  >
                    Google Auth
                  </button>
                </div>

                {error && <p className="error">{error}</p>}
                <p className="redirect-msg">
                  Don&apos;t have an account? <a href="#">Contact Admin</a>
                </p>
              </form>
            </div>
          </div>
        </main>

        <footer>
          <p>&copy; 2025 CSE Department - Qatar University</p>
        </footer>
      </div>
    </>
  );
}