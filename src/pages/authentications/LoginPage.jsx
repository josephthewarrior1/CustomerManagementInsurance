import { useFormik } from 'formik';
import { CustomButton, CustomTextInput } from '../../reusables';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect, useState } from 'react';
import UserDAO from '../../daos/UserDAO';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, Stack, Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { Icon } from '@iconify/react';

const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    html, body, #root {
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        overflow: hidden !important;
    }

    .login-root * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .login-root {
        font-family: 'DM Sans', sans-serif;
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eef2ff;
        overflow: hidden;
    }

    /* ─── BG BLOBS ─── */
    .login-blob {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
    }

    .login-blob-1 {
        width: 480px;
        height: 480px;
        background: radial-gradient(circle, rgba(26,111,245,0.13) 0%, transparent 70%);
        top: -160px;
        left: -100px;
    }

    .login-blob-2 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(26,63,168,0.09) 0%, transparent 70%);
        bottom: -120px;
        right: -80px;
    }

    /* ─── DECORATIVE ─── */
    .login-deco {
        position: absolute;
        pointer-events: none;
        z-index: 0;
    }

    .login-deco-box {
        width: 100px;
        height: 100px;
        border: 2px solid rgba(26,111,245,0.12);
        border-radius: 16px;
        top: 44px;
        left: 48px;
    }

    .login-deco-circle {
        width: 72px;
        height: 72px;
        background: rgba(26,111,245,0.06);
        border-radius: 50%;
        bottom: 64px;
        right: 64px;
    }

    .login-deco-dot-1 {
        width: 11px;
        height: 11px;
        background: #1a6ef5;
        border-radius: 50%;
        opacity: 0.3;
        top: 100px;
        right: 130px;
    }

    .login-deco-dot-2 {
        width: 7px;
        height: 7px;
        background: #1a3fa8;
        border-radius: 50%;
        opacity: 0.22;
        bottom: 120px;
        left: 90px;
    }

    .login-deco-ring {
        width: 48px;
        height: 48px;
        border: 2px solid rgba(26,111,245,0.09);
        border-radius: 50%;
        top: 50%;
        left: 32px;
        transform: translateY(-50%);
    }

    .login-squiggle {
        position: absolute;
        opacity: 0.1;
        pointer-events: none;
        z-index: 0;
    }

    /* ─── CARD ─── */
    .login-card {
        position: relative;
        z-index: 1;
        background: #fff;
        border-radius: 28px;
        padding: 52px 52px 48px;
        width: 100%;
        max-width: 520px;
        box-shadow:
            0 2px 4px rgba(26,63,168,0.04),
            0 14px 44px rgba(26,63,168,0.10);
        animation: cardIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    @keyframes cardIn {
        from { opacity: 0; transform: translateY(18px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* ─── TITLE ─── */
    .login-title {
        font-family: 'Sora', sans-serif;
        font-size: 25px;
        font-weight: 800;
        color: #0f1b3d;
        text-align: center;
        margin-bottom: 6px;
        letter-spacing: -0.4px;
        animation: fadeUp 0.4s ease 0.05s both;
    }

    .login-sub {
        font-size: 13px;
        color: #8a94b2;
        text-align: center;
        margin-bottom: 32px;
        font-weight: 400;
        line-height: 1.55;
        animation: fadeUp 0.4s ease 0.1s both;
    }

    /* ─── FIELDS ─── */
    .login-field-group {
        display: flex;
        flex-direction: column;
        gap: 18px;
        margin-bottom: 4px;
        animation: fadeUp 0.4s ease 0.15s both;
    }

    .login-field-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #374163;
        margin-bottom: 6px;
        letter-spacing: 0.1px;
    }

    .login-field-group .MuiInputBase-root,
    .login-field-group .MuiOutlinedInput-root {
        height: 52px !important;
    }

    .login-field-group .MuiInputBase-input {
        padding: 14px 16px !important;
        height: 52px !important;
        box-sizing: border-box !important;
        font-size: 14px !important;
    }

    /* ─── TROUBLE ─── */
    .login-trouble {
        margin: 12px 0 24px;
        animation: fadeUp 0.4s ease 0.2s both;
    }

    .login-trouble button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12.5px;
        color: #1a6ef5;
        font-weight: 500;
        font-family: 'DM Sans', sans-serif;
        padding: 0;
    }

    .login-trouble button:hover { text-decoration: underline; }

    /* ─── SUBMIT ─── */
    .login-submit-btn {
        width: 100%;
        height: 52px !important;
        background: linear-gradient(135deg, #1a3fa8 0%, #1a6ef5 100%) !important;
        border-radius: 14px !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        font-family: 'Sora', sans-serif !important;
        letter-spacing: 0.2px !important;
        box-shadow: 0 7px 20px rgba(26,110,245,0.30) !important;
        transition: all 0.18s ease !important;
        animation: fadeUp 0.4s ease 0.25s both;
    }

    .login-submit-btn:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 12px 30px rgba(26,110,245,0.40) !important;
    }

    .login-submit-btn:disabled { opacity: 0.6 !important; }

    /* ─── SIGNUP ─── */
    .login-signup-link {
        text-align: center;
        margin-top: 22px;
        font-size: 13px;
        color: #8a94b2;
        animation: fadeUp 0.4s ease 0.3s both;
    }

    .login-signup-link button {
        background: none;
        border: none;
        cursor: pointer;
        color: #1a6ef5;
        font-weight: 600;
        font-size: 13px;
        font-family: 'DM Sans', sans-serif;
        padding: 0;
    }

    .login-signup-link button:hover { text-decoration: underline; }

    /* ─── COPYRIGHT ─── */
    .login-copyright {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        color: #a0abc8;
        z-index: 1;
        white-space: nowrap;
        font-family: 'DM Sans', sans-serif;
    }

    .login-copyright a {
        color: #1a6ef5;
        text-decoration: none;
    }

    .login-copyright a:hover { text-decoration: underline; }
`;

export default function LoginPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const validationSchema = Yup.object({
        login: Yup.string().required('Username atau email wajib diisi!'),
        password: Yup.string().required('Password wajib diisi!'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();
            const result = await UserDAO.login({
                login: data.login.trim(),
                password: data.password.trim(),
            });

            if (!result.success) throw new Error(result.error || 'Login gagal');
            await signOut(auth).catch(() => {});
            localStorage.setItem('authToken', result.token);

            const userData = result.user;

            login({
                id: userData.id,
                username: userData.username,
                fullName: userData.fullName,
                email: userData.email || '',
            });

            // Welcome back message
            const userName = userData.fullName || userData.username;
            message(`✨ Selamat datang kembali, ${userName}! ✨`, 'success');

            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error('Login error:', error);
            // Translate Firebase specific errors if necessary
            let errMsg = 'Login gagal. Periksa kembali username/password Anda.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                errMsg = 'Email atau password salah.';
            }
            message(errMsg, 'error');
        } finally {
            loading.stop();
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail) {
            message('Email tidak boleh kosong', 'error');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forgotEmail)) {
            message('Format email tidak valid', 'error');
            return;
        }

        setForgotLoading(true);
        try {
            await sendPasswordResetEmail(auth, forgotEmail.trim());
            message('Jika email terdaftar, instruksi reset telah dikirimkan ke email Anda.', 'success');
            setForgotPasswordOpen(false);
            setForgotEmail('');
        } catch (error) {
            console.error('Forgot password error:', error);
            if (error.code === 'auth/user-not-found') {
                message('Email tidak terdaftar di sistem kami.', 'error');
            } else if (error.code === 'auth/invalid-email') {
                message('Format email tidak valid.', 'error');
            } else {
                message('Terjadi kesalahan. Silakan coba lagi.', 'error');
            }
        } finally {
            setForgotLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: { login: '', password: '' },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    if (isLoading) {
        return (
            <div style={{
                position: 'fixed', inset: 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                background: '#eef2ff'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 36, height: 36,
                        border: '3px solid #dde6ff', borderTopColor: '#1a6ef5',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 12px'
                    }} />
                    <p style={{ color: '#8a94b2', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Memuat...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <div className="login-root">

                {/* Blobs */}
                <div className="login-blob login-blob-1" />
                <div className="login-blob login-blob-2" />

                {/* Deco */}
                <div className="login-deco login-deco-box" />
                <div className="login-deco login-deco-circle" />
                <div className="login-deco login-deco-dot-1" />
                <div className="login-deco login-deco-dot-2" />
                <div className="login-deco login-deco-ring" />

                {/* Squiggles */}
                <svg className="login-squiggle" style={{ top: 68, left: 180, width: 84 }} viewBox="0 0 100 20" fill="none">
                    <path d="M0 10 Q12.5 0 25 10 Q37.5 20 50 10 Q62.5 0 75 10 Q87.5 20 100 10" stroke="#1a6ef5" strokeWidth="2.5" fill="none" />
                </svg>
                <svg className="login-squiggle" style={{ bottom: 80, right: 170, width: 66 }} viewBox="0 0 100 20" fill="none">
                    <path d="M0 10 Q12.5 0 25 10 Q37.5 20 50 10 Q62.5 0 75 10 Q87.5 20 100 10" stroke="#1a3fa8" strokeWidth="2.5" fill="none" />
                </svg>

                {/* Card */}
                <div className="login-card">
                    <h1 className="login-title">Login Agen</h1>
                    <p className="login-sub">Masukkan detail Anda untuk masuk<br />ke akun Anda</p>

                    <form onSubmit={formik.handleSubmit}>
                        <div className="login-field-group">
                            <div>
                                <label className="login-field-label">Email / Username</label>
                                <CustomTextInput
                                    name="login"
                                    fullWidth
                                    placeholder="Masukkan email atau username Anda"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.login}
                                    error={formik.touched.login && Boolean(formik.errors.login)}
                                    helperText={formik.touched.login && formik.errors.login}
                                />
                            </div>
                            <div>
                                <label className="login-field-label">Password</label>
                                <CustomTextInput
                                    name="password"
                                    fullWidth
                                    placeholder="Masukkan password Anda"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.password}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={formik.touched.password && formik.errors.password}
                                    type={showPassword ? "text" : "password"}
                                    endAdornment={
                                        <InputAdornment position="end" style={{ marginRight: 24 }}>
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="small"
                                            >
                                                <Icon icon={showPassword ? "mdi:eye-outline" : "mdi:eye-off-outline"} color="#8a94b2" width={22} />
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </div>
                        </div>

                        <div className="login-trouble">
                            <button type="button" onClick={() => setForgotPasswordOpen(true)}>
                                Kesulitan masuk?
                            </button>
                        </div>

                        <CustomButton
                            fullWidth
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="login-submit-btn"
                        >
                            {formik.isSubmitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                    Memasuki...
                                </span>
                            ) : 'Masuk'}
                        </CustomButton>
                    </form>

                    <div className="login-signup-link">
                        Belum punya akun?{' '}
                        <button type="button" onClick={() => navigate('/signup')}>Daftar Sekarang</button>
                    </div>
                </div>

                <div className="login-copyright">
                    Hak Cipta @2025 &nbsp;|&nbsp; <a href="#">Kebijakan Privasi</a>
                </div>

            </div>

            {/* Forgot Password Dialog */}
            <Dialog 
                open={forgotPasswordOpen} 
                onClose={() => !forgotLoading && setForgotPasswordOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        background: '#ffffff',
                        p: 1
                    }
                }}
                BackdropProps={{
                    sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }
                }}
            >
                <DialogTitle sx={{ pb: 1, pt: 3, textAlign: 'center' }}>
                    <Box sx={{ 
                        width: 56, height: 56, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', color: '#1d4ed8'
                    }}>
                        <Icon icon="mdi:lock-reset" width={28} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#0f172a', letterSpacing: '-0.02em', mb: 1 }}>
                        Lupa Password?
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, px: 2 }}>
                        Masukkan email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang password.
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 4, pt: 1 }}>
                    <TextField
                        fullWidth
                        placeholder="Misal: agen@kudajaya.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        disabled={forgotLoading}
                        autoFocus
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon icon="mdi:email-outline" width={20} color="#94a3b8" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
                        }}
                        sx={{ mt: 1, mb: 3 }}
                    />
                    <Stack direction="row" spacing={1.5}>
                        <Button 
                            fullWidth
                            variant="outlined"
                            disabled={forgotLoading}
                            onClick={() => setForgotPasswordOpen(false)}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}
                        >
                            Batal
                        </Button>
                        <Button 
                            fullWidth
                            variant="contained"
                            disabled={forgotLoading}
                            onClick={handleForgotPassword}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                        >
                            {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Kirim Link'}
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}



