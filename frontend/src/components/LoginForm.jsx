import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginForm = ({ onSwitch }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            console.error("Login error:", err);
            const msg = err.response?.data?.detail || "Đăng nhập thất bại";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h2>Đăng Nhập</h2>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Đăng Nhập"}
                </button>
            </form>
            <p className="auth-switch">
                Chưa có tài khoản?{" "}
                <span onClick={onSwitch}>Đăng ký ngay</span>
            </p>
        </div>
    );
};

export default LoginForm;
