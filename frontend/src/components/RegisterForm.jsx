
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const RegisterForm = ({ onSwitch }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { register } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Mật khẩu không khớp");
            return;
        }

        try {
            await register(email, password);
            setSuccess("Đăng ký thành công! Vui lòng Đăng nhập.");
            setTimeout(() => onSwitch(), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed");
        }
    };

    return (
        <div className="container" style={{ maxWidth: "400px", background: "white", padding: "30px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Đăng Ký</h2>
            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
            {success && <p style={{ color: "green", textAlign: "center" }}>{success}</p>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
                    required
                />
                <input
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
                    required
                />
                <button
                    type="submit"
                    style={{
                        padding: "10px",
                        background: "#6366f1",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Đăng Ký
                </button>
            </form>
            <p style={{ marginTop: "15px", textAlign: "center", fontSize: "0.9rem" }}>
                Đã có tài khoản? <span onClick={onSwitch} style={{ color: "#6366f1", cursor: "pointer", fontWeight: "bold" }}>Đăng nhập</span>
            </p>
        </div>
    );
};
export default RegisterForm;
