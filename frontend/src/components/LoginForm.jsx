import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

const LoginForm = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Đăng nhập thất bại';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-bg rounded-2xl shadow-glass p-8 w-full max-w-[400px]">
            <h2 className="text-center text-main text-2xl font-bold mb-6">Đăng Nhập</h2>
            {error && (
                <div className="p-message p-message-error w-full mb-3">
                    <div className="p-message-wrapper">
                        <div className="p-message-text">
                            {error}
                        </div>
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <label htmlFor="login-email" className="text-sm font-medium text-light">Email</label>
                    <InputText
                        id="login-email"
                        type="email"
                        placeholder="Nhập email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        className="w-full"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="login-password" className="text-sm font-medium text-light">Mật khẩu</label>
                    <Password
                        inputId="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        feedback={false}
                        toggleMask
                        required
                        className="w-full"
                        inputClassName="w-full"
                    />
                </div>
                <Button
                    type="submit"
                    label={loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    disabled={loading}
                    className="w-full mt-2 bg-blue-400 h-10"
                />
            </form>
            <p className="text-center mt-4 text-light text-sm">
                Chưa có tài khoản?{' '}
                <span
                    className="text-[var(--color-primary)] font-semibold cursor-pointer hover:underline"
                    onClick={onSwitch}
                >
                    Đăng ký ngay
                </span>
            </p>
        </div>
    );
};

export default LoginForm;
