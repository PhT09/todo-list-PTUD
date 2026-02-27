import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

const RegisterForm = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            await register(email, password);
            setSuccess('Đăng ký thành công! Chuyển sang đăng nhập...');
            setTimeout(() => onSwitch(), 1500);
        } catch (err) {
            console.error('Register error:', err);
            const msg = err.response?.data?.detail || 'Đăng ký thất bại';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-bg rounded-2xl shadow-glass p-8 w-full max-w-[400px]">
            <h2 className="text-center text-main text-2xl font-bold mb-6">Đăng Ký</h2>
            {error && (
                <div className="p-message p-message-error w-full mb-3">
                    <div className="p-message-wrapper">
                        <div className="p-message-text">
                            {error}
                        </div>
                    </div>
                </div>
            )}
            {success && (
                <div className="p-message p-message-success w-full mb-3">
                    <div className="p-message-wrapper">
                        <div className="p-message-text">
                            {success}
                        </div>
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <label htmlFor="reg-email" className="text-sm font-medium text-light">Email</label>
                    <InputText
                        id="reg-email"
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
                    <label htmlFor="reg-password" className="text-sm font-medium text-light">Mật khẩu</label>
                    <Password
                        inputId="reg-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        feedback={false}
                        toggleMask
                        required
                        className="w-full"
                        inputClassName="w-full"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="reg-confirm" className="text-sm font-medium text-light">Xác nhận mật khẩu</label>
                    <Password
                        inputId="reg-confirm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        feedback={false}
                        toggleMask
                        required
                        className="w-full"
                        inputClassName="w-full"
                    />
                </div>
                <Button
                    type="submit"
                    label={loading ? 'Đang xử lý...' : 'Đăng Ký'}
                    disabled={loading}
                    className="w-full mt-2 bg-blue-400 h-10"
                />
            </form>
            <p className="text-center mt-4 text-light text-sm">
                Đã có tài khoản?{' '}
                <span
                    className="text-[var(--color-primary)] font-semibold cursor-pointer hover:underline"
                    onClick={onSwitch}
                >
                    Đăng nhập
                </span>
            </p>
        </div>
    );
};

export default RegisterForm;
