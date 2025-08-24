import { useState } from "react";
import axios from "axios";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/signup", {
        name,
        email,
        password,
      });
      alert("Signup successful! Please login.");
    } catch (err) {
      alert("Error: " + err.response.data.error);
    }
  };

  return (
    <form onSubmit={handleSignup} className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-2">Signup</h2>
      <input
        type="text"
        placeholder="Name"
        className="border p-2 w-full mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        className="border p-2 w-full mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-full mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="bg-green-500 text-white p-2 w-full">
        Signup
      </button>
    </form>
  );
}
