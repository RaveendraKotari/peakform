import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { get, post } from "./api/api"; // common Axios wrapper

import Login from "./components/Login";
import Signup from "./components/Signup";

// -------------------
// Profile component
// -------------------
function Profile({ user }) {
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user); // only load if user is not passed
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) {
      const fetchProfile = async () => {
        try {
          const data = await get("/profile");
          setProfile(data.user || data);
        } catch (err) {
          setProfile(null);
          setError(err.error || "Failed to fetch profile");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [profile]);

  if (loading) return <p className="text-center p-4">Loading profile...</p>;
  if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Welcome {profile.name}</h2>
      <p>Email: {profile.email}</p>
    </div>
  );
}

// -------------------
// App component
// -------------------
export default function App() {
  const [user, setUser] = useState(null);

  // Fetch profile on app load if token exists
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const data = await get("/profile");
          setUser(data.user || data);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await post("/logout");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <Router>
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/">Home</Link>
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/signup">Signup</Link>}
        {user && <Link to="/profile">Profile</Link>}
        {user && (
          <button onClick={logout} className="ml-auto text-red-500">
            Logout
          </button>
        )}
      </nav>

      <Routes>
        <Route
          path="/"
          element={<h1 className="p-4 text-center">Welcome to My App</h1>}
        />
        <Route
          path="/login"
          element={
            user ? <Navigate to="/profile" /> : <Login setUser={setUser} />
          }
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/profile" /> : <Signup />}
        />
        <Route
          path="/profile"
          element={user ? <Profile user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}
