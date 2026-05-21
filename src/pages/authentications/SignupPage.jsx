import { useFormik } from 'formik';
import { CustomButton, CustomTextInput } from '../../reusables';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect, useState } from 'react';
import UserDAO from '../../daos/UserDAO';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { InputAdornment, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';

const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    html, body, #root {
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        overflow: hidden !important;
    }

    .signup-root * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .signup-root {
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
    .signup-blob {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
    }

    .signup-blob-1 {
        width: 480px;
        height: 480px;
        background: radial-gradient(circle, rgba(26,111,245,0.13) 0%, transparent 70%);
        top: -160px;
        left: -100px;
    }

    .signup-blob-2 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(26,63,168,0.09) 0%, transparent 70%);
        bottom: -120px;
        right: -80px;
    }

    /* ─── DECORATIVE ─── */
    .signup-deco {
        position: absolute;
        pointer-events: none;
        z-index: 0;
    }

    .signup-deco-box {
        width: 100px;
        height: 100px;
        border: 2px solid rgba(26,111,245,0.12);
        border-radius: 16px;
        top: 44px;
        left: 48px;
    }

    .signup-deco-circle {
        width: 72px;
        height: 72px;
        background: rgba(26,111,245,0.06);
        border-radius: 50%;
        bottom: 64px;
        right: 64px;
    }

    .signup-deco-dot-1 {
        width: 11px;
        height: 11px;
        background: #1a6ef5;
        border-radius: 50%;
        opacity: 0.3;
        top: 100px;
        right: 130px;
    }

    .signup-deco-dot-2 {
        width: 7px;
        height: 7px;
        background: #1a3fa8;
        border-radius: 50%;
        opacity: 0.22;
        bottom: 120px;
        left: 90px;
    }

    .signup-deco-ring {
        width: 48px;
        height: 48px;
        border: 2px solid rgba(26,111,245,0.09);
        border-radius: 50%;
        top: 50%;
        left: 32px;
        transform: translateY(-50%);
    }

    .signup-squiggle {
        position: absolute;
        opacity: 0.1;
        pointer-events: none;
        z-index: 0;
    }

    /* ─── CARD ─── */
    .signup-card {
        position: relative;
        z-index: 1;
        background: #fff;
        border-radius: 28px;
        padding: 48px 52px 44px;
        width: 100%;
        max-width: 560px;
        max-height: 92vh;
        overflow-y: auto;
        box-shadow:
            0 2px 4px rgba(26,63,168,0.04),
            0 14px 44px rgba(26,63,168,0.10);
        animation: cardIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
        scrollbar-width: none;
    }

    .signup-card::-webkit-scrollbar { display: none; }

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
    .signup-title {
        font-family: 'Sora', sans-serif;
        font-size: 25px;
        font-weight: 800;
        color: #0f1b3d;
        text-align: center;
        margin-bottom: 6px;
        letter-spacing: -0.4px;
        animation: fadeUp 0.4s ease 0.05s both;
    }

    .signup-sub {
        font-size: 13px;
        color: #8a94b2;
        text-align: center;
        margin-bottom: 32px;
        font-weight: 400;
        line-height: 1.55;
        animation: fadeUp 0.4s ease 0.1s both;
    }

    /* ─── FIELDS ─── */
    .signup-field-group {
        display: flex;
        flex-direction: column;
        gap: 18px;
        margin-bottom: 24px;
        animation: fadeUp 0.4s ease 0.15s both;
    }

    .signup-field-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #374163;
        margin-bottom: 6px;
        letter-spacing: 0.1px;
    }

    .signup-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
    }

    .signup-field-group .MuiInputBase-root,
    .signup-field-group .MuiOutlinedInput-root {
        height: 52px !important;
    }

    .signup-field-group .MuiInputBase-input {
        padding: 14px 16px !important;
        height: 52px !important;
        box-sizing: border-box !important;
        font-size: 14px !important;
    }

    /* ─── SUBMIT ─── */
    .signup-submit-btn {
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
        animation: fadeUp 0.4s ease 0.2s both;
    }

    .signup-submit-btn:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 12px 30px rgba(26,110,245,0.40) !important;
    }

    .signup-submit-btn:disabled { opacity: 0.6 !important; }

    /* ─── PRIVACY ─── */
    .signup-privacy {
        font-size: 11.5px;
        color: #a0abc8;
        text-align: center;
        margin-top: 14px;
        line-height: 1.6;
        animation: fadeUp 0.4s ease 0.25s both;
    }

    .signup-privacy a {
        color: #1a6ef5;
        text-decoration: none;
        font-weight: 500;
    }

    .signup-privacy a:hover { text-decoration: underline; }

    /* ─── LOGIN LINK ─── */
    .signup-login-link {
        text-align: center;
        margin-top: 20px;
        font-size: 13px;
        color: #8a94b2;
        animation: fadeUp 0.4s ease 0.3s both;
    }

    .signup-login-link button {
        background: none;
        border: none;
        cursor: pointer;
        color: #1a6ef5;
        font-weight: 600;
        font-size: 13px;
        font-family: 'DM Sans', sans-serif;
        padding: 0;
    }

    .signup-login-link button:hover { text-decoration: underline; }

    /* ─── COPYRIGHT ─── */
    .signup-copyright {
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

    .signup-copyright a {
        color: #1a6ef5;
        text-decoration: none;
    }

    .signup-copyright a:hover { text-decoration: underline; }
`;

export default function SignUpPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const validationSchema = Yup.object({
        fullName: Yup.string().required('Nama lengkap wajib diisi!').min(2, 'Minimal 2 karakter'),
        username: Yup.string()
            .required('Username wajib diisi!')
            .min(4, 'Minimal 4 karakter')
            .matches(/^[a-zA-Z0-9_]+$/, 'Hanya huruf, angka, dan underscore'),
        email: Yup.string().email('Format email tidak valid').required('Email wajib diisi!'),
        password: Yup.string().required('Password wajib diisi!').min(6, 'Minimal 6 karakter'),
        confirmPassword: Yup.string()
            .required('Konfirmasi password wajib diisi!')
            .oneOf([Yup.ref('password'), null], 'Password harus sama'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();
            const result = await UserDAO.signUp({
                fullName: data.fullName.trim(),
                username: data.username.trim(),
                email: data.email.trim().toLowerCase(),
                password: data.password.trim(),
                role: 'user',
            });
            if (!result.success) throw new Error(result.error || 'Pendaftaran gagal');
            await signOut(auth).catch(() => {});
            if (result.token) localStorage.setItem('authToken', result.token);
            login({
                id: result.user.id,
                username: result.user.username,
                fullName: result.user.fullName,
                role: result.user.role || 'user',
                email: result.user.email || '',
            });
            message('Akun berhasil dibuat!', 'success');
            navigate('/', { replace: true });
        } catch (error) {
            message(error.message || 'Pendaftaran gagal. Silakan coba lagi.', 'error');
        } finally {
            loading.stop();
        }
    };

    const formik = useFormik({
        initialValues: { fullName: '', username: '', email: '', password: '', confirmPassword: '' },
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
            <div className="signup-root">

                {/* Blobs */}
                <div className="signup-blob signup-blob-1" />
                <div className="signup-blob signup-blob-2" />

                {/* Deco */}
                <div className="signup-deco signup-deco-box" />
                <div className="signup-deco signup-deco-circle" />
                <div className="signup-deco signup-deco-dot-1" />
                <div className="signup-deco signup-deco-dot-2" />
                <div className="signup-deco signup-deco-ring" />

                {/* Squiggles */}
                <svg className="signup-squiggle" style={{ top: 68, left: 180, width: 84 }} viewBox="0 0 100 20" fill="none">
                    <path d="M0 10 Q12.5 0 25 10 Q37.5 20 50 10 Q62.5 0 75 10 Q87.5 20 100 10" stroke="#1a6ef5" strokeWidth="2.5" fill="none" />
                </svg>
                <svg className="signup-squiggle" style={{ bottom: 80, right: 170, width: 66 }} viewBox="0 0 100 20" fill="none">
                    <path d="M0 10 Q12.5 0 25 10 Q37.5 20 50 10 Q62.5 0 75 10 Q87.5 20 100 10" stroke="#1a3fa8" strokeWidth="2.5" fill="none" />
                </svg>

                {/* Card */}
                <div className="signup-card">
                    <h1 className="signup-title">Buat Akun</h1>
                    <p className="signup-sub">Daftar untuk mulai menggunakan dashboard</p>

                    <form onSubmit={formik.handleSubmit}>
                        <div className="signup-field-group">
                            <div className="signup-row">
                                <div>
                                    <label className="signup-field-label">Nama Lengkap</label>
                                    <CustomTextInput
                                        name="fullName"
                                        fullWidth
                                        placeholder="Masukkan nama lengkap"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.fullName}
                                        error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                                        helperText={formik.touched.fullName && formik.errors.fullName}
                                    />
                                </div>
                                <div>
                                    <label className="signup-field-label">Username</label>
                                    <CustomTextInput
                                        name="username"
                                        fullWidth
                                        placeholder="johndoe123"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.username}
                                        error={formik.touched.username && Boolean(formik.errors.username)}
                                        helperText={formik.touched.username && formik.errors.username}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="signup-field-label">Alamat Email</label>
                                <CustomTextInput
                                    name="email"
                                    fullWidth
                                    placeholder="Masukkan alamat email"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.email}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                    type="email"
                                />
                            </div>

                            <div className="signup-row">
                                <div>
                                    <label className="signup-field-label">Password</label>
                                    <CustomTextInput
                                        name="password"
                                        fullWidth
                                        placeholder="••••••••"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.password}
                                        error={formik.touched.password && Boolean(formik.errors.password)}
                                        helperText={formik.touched.password && formik.errors.password}
                                        type={showPassword ? "text" : "password"}
                                        endAdornment={
                                            <InputAdornment position="end">
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
                                <div>
                                    <label className="signup-field-label">Konfirmasi Password</label>
                                    <CustomTextInput
                                        name="confirmPassword"
                                        fullWidth
                                        placeholder="••••••••"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.confirmPassword}
                                        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                        type={showConfirmPassword ? "text" : "password"}
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    <Icon icon={showConfirmPassword ? "mdi:eye-outline" : "mdi:eye-off-outline"} color="#8a94b2" width={22} />
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <CustomButton
                            fullWidth
                            type="submit"
                            disabled={!formik.isValid || formik.isSubmitting}
                            className="signup-submit-btn"
                        >
                            {formik.isSubmitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                    Sedang membuat akun...
                                </span>
                            ) : 'Daftar'}
                        </CustomButton>

                        <p className="signup-privacy">
                            Dengan membuat akun, Anda menyetujui{' '}
                            <a href="#">Syarat dan Ketentuan</a> serta <a href="#">Kebijakan Privasi</a>
                        </p>
                    </form>

                    <div className="signup-login-link">
                        Sudah punya akun?{' '}
                        <button type="button" onClick={() => navigate('/login')}>Masuk</button>
                    </div>
                </div>

                <div className="signup-copyright">
                    Hak Cipta @2025 &nbsp;|&nbsp; <a href="#">Kebijakan Privasi</a>
                </div>

            </div>
        </>
    );
}
