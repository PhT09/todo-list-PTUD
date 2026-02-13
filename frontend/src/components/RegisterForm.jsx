import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const RegisterForm = ({ onSwitch }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }
        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setLoading(true);
        try {
            await register(email, password);
            setSuccess("Đăng ký thành công! Chuyển sang đăng nhập...");
            setTimeout(() => onSwitch(), 1500);
        } catch (err) {
            console.error("Register error:", err);
            const msg = err.response?.data?.detail || "Đăng ký thất bại";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h2>Đăng Ký</h2>
            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}
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
                    placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Đăng Ký"}
                </button>
            </form>
            <p className="auth-switch">
                Đã có tài khoản?{" "}
                <span onClick={onSwitch}>Đăng nhập</span>
            </p>
        </div>
    );
};

export default RegisterForm;
