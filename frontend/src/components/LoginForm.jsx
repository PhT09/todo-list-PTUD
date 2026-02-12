
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const LoginForm = ({ onSwitch }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.detail || "Login failed");
        }
    };

    return (
        <div className="container" style={{ maxWidth: "400px", background: "white", padding: "30px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Đăng Nhập</h2>
            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
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
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Đăng Nhập
                </button>
            </form>
            <p style={{ marginTop: "15px", textAlign: "center", fontSize: "0.9rem" }}>
                Chưa có tài khoản? <span onClick={onSwitch} style={{ color: "#6366f1", cursor: "pointer", fontWeight: "bold" }}>Đăng ký ngay</span>
            </p>
        </div>
    );
};
export default LoginForm;
