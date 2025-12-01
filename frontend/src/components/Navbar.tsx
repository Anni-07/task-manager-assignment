"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    setLogged(!!token);
  }, []);

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    window.location.href = "/";
  };

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between">
      <Link href="/" className="font-bold text-xl">
        Task Manager
      </Link>

      <div className="flex gap-4">
        {logged ? (
          <>
            <Link href="/tasks">My Tasks</Link>
            <button className="text-red-600" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
