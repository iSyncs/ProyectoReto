import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/App.css";

function Recover() {
  const [email, setEmail] = useState("");

  const handleRecover = (e) => {
    e.preventDefault();
    alert(`Se enviará un enlace de recuperación a: ${email}`);
  };

  return (
    <div className="login-wrapper" style={{ maxWidth: "500px", minHeight: "400px" }}>
      <div className="login-right" style={{ flex: "1", padding: "3rem" }}>
        <h2 className="title">Recover Password</h2>

        <p style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          Enter your email and we will send you instructions to reset your password.
        </p>

        <form onSubmit={handleRecover}>
          <input
            type="email"
            placeholder="Email address"
            className="full-width"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="signup-btn">Send recovery link</button>
        </form>

        <br />
        <Link to="/" className="recover-link">Back to login</Link>
      </div>
    </div>
  );
}

export default Recover;
