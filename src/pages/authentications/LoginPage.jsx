import { useFormik } from 'formik';
import { CustomButton, CustomTextInput } from '../../reusables';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect } from 'react';
import UserDAO from '../../daos/UserDAO';

const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    .login-root * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .login-root {
        font-family: 'DM Sans', sans-serif;
        min-height: 100vh;
        display: flex;
        background: #f0f4ff;
    }

    /* ─── LEFT PANEL ─── */
    .login-left {
        width: 45%;
        background: linear-gradient(145deg, #1a3fa8 0%, #1251d4 40%, #1a6ef5 100%);
        border-radius: 0 32px 32px 0;
        padding: 48px 52px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
    }

    .login-left::before {
        content: '';
        position: absolute;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        top: -120px;
        right: -100px;
    }

    .login-left::after {
        content: '';
        position: absolute;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        bottom: 60px;
        left: -80px;
    }

    .login-left-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1;
    }

    .login-left-brand-icon {
        width: 44px;
        height: 44px;
        background: rgba(255,255,255,0.18);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.25);
    }

    .login-left-brand-name {
        font-family: 'Sora', sans-serif;
        font-weight: 700;
        font-size: 20px;
        color: #fff;
        letter-spacing: -0.3px;
    }

    .login-left-content {
        z-index: 1;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 48px 0 32px;
    }

    .login-left-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.15);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 100px;
        padding: 6px 14px 6px 8px;
        width: fit-content;
        margin-bottom: 28px;
        backdrop-filter: blur(6px);
    }

    .login-left-tag-dot {
        width: 8px;
        height: 8px;
        background: #7ee8a2;
        border-radius: 50%;
        box-shadow: 0 0 6px #7ee8a2;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }

    .login-left-tag span {
        font-size: 12px;
        color: rgba(255,255,255,0.9);
        font-weight: 500;
        letter-spacing: 0.3px;
    }

    .login-left-headline {
        font-family: 'Sora', sans-serif;
        font-size: 40px;
        font-weight: 800;
        color: #fff;
        line-height: 1.15;
        letter-spacing: -1px;
        margin-bottom: 20px;
    }

    .login-left-headline span {
        position: relative;
        display: inline-block;
    }

    .login-left-headline span::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 0;
        width: 100%;
        height: 3px;
        background: rgba(255,255,255,0.45);
        border-radius: 2px;
    }

    .login-left-sub {
        font-size: 15px;
        color: rgba(255,255,255,0.72);
        line-height: 1.65;
        max-width: 320px;
        font-weight: 300;
    }

    .login-left-stats {
        display: flex;
        gap: 20px;
        margin-top: 40px;
        z-index: 1;
    }

    .login-stat-card {
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 16px;
        padding: 16px 20px;
        backdrop-filter: blur(8px);
        flex: 1;
    }

    .login-stat-value {
        font-family: 'Sora', sans-serif;
        font-size: 24px;
        font-weight: 700;
        color: #fff;
        line-height: 1;
        margin-bottom: 4px;
    }

    .login-stat-label {
        font-size: 11px;
        color: rgba(255,255,255,0.6);
        font-weight: 400;
        letter-spacing: 0.4px;
        text-transform: uppercase;
    }

    .login-left-illustration {
        position: absolute;
        bottom: 120px;
        right: 0;
        width: 240px;
        opacity: 0.12;
        z-index: 0;
    }

    /* ─── RIGHT PANEL ─── */
    .login-right {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 64px;
        background: #f0f4ff;
    }

    .login-right-inner {
        width: 100%;
        max-width: 400px;
    }

    .login-right-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        margin-bottom: 36px;
    }

    .login-right-logo-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #1a3fa8, #1a6ef5);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .login-right-logo-name {
        font-family: 'Sora', sans-serif;
        font-weight: 700;
        font-size: 18px;
        color: #1a3fa8;
        letter-spacing: -0.3px;
    }

    .login-right-title {
        font-family: 'Sora', sans-serif;
        font-size: 30px;
        font-weight: 800;
        color: #0f1b3d;
        text-align: center;
        margin-bottom: 8px;
        letter-spacing: -0.8px;
    }

    .login-right-sub {
        font-size: 14px;
        color: #8a94b2;
        text-align: center;
        margin-bottom: 36px;
        font-weight: 400;
    }

    .login-field-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 8px;
    }

    .login-field-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #374163;
        margin-bottom: 6px;
        letter-spacing: 0.1px;
    }

    .login-forgot {
        text-align: right;
        margin: 10px 0 24px;
    }

    .login-forgot button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 13px;
        color: #1a6ef5;
        font-weight: 500;
        font-family: 'DM Sans', sans-serif;
        padding: 0;
    }

    .login-forgot button:hover {
        text-decoration: underline;
    }

    .login-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 24px 0;
    }

    .login-divider-line {
        flex: 1;
        height: 1px;
        background: #dde3f5;
    }

    .login-divider-text {
        font-size: 12px;
        color: #a0abc8;
        font-weight: 500;
        white-space: nowrap;
    }

    .login-signup-link {
        text-align: center;
        margin-top: 28px;
        font-size: 14px;
        color: #8a94b2;
    }

    .login-signup-link button {
        background: none;
        border: none;
        cursor: pointer;
        color: #1a6ef5;
        font-weight: 600;
        font-size: 14px;
        font-family: 'DM Sans', sans-serif;
        padding: 0;
    }

    .login-signup-link button:hover {
        text-decoration: underline;
    }

    .login-trust-badges {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #dde3f5;
    }

    .login-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #a0abc8;
        font-size: 11px;
        font-weight: 500;
    }

    /* Mobile */
    @media (max-width: 768px) {
        .login-left { display: none; }
        .login-right {
            padding: 36px 24px;
            background: linear-gradient(160deg, #f0f4ff 0%, #e8eeff 100%);
        }
    }

    /* Submit button override */
    .login-submit-btn {
        width: 100%;
        height: 52px !important;
        background: linear-gradient(135deg, #1a3fa8 0%, #1a6ef5 100%) !important;
        border-radius: 14px !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        font-family: 'Sora', sans-serif !important;
        letter-spacing: 0.2px !important;
        box-shadow: 0 8px 24px rgba(26, 110, 245, 0.35) !important;
        transition: all 0.2s ease !important;
    }

    .login-submit-btn:hover:not(:disabled) {
        transform: translateY(-1px) !important;
        box-shadow: 0 12px 32px rgba(26, 110, 245, 0.45) !important;
    }

    .login-submit-btn:disabled {
        opacity: 0.6 !important;
    }

    /* Animate in */
    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .login-right-inner > * {
        animation: fadeUp 0.5s ease both;
    }
    .login-right-inner > *:nth-child(1) { animation-delay: 0.05s; }
    .login-right-inner > *:nth-child(2) { animation-delay: 0.1s; }
    .login-right-inner > *:nth-child(3) { animation-delay: 0.15s; }
    .login-right-inner > *:nth-child(4) { animation-delay: 0.2s; }
`;

export default function LoginPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const validationSchema = Yup.object({
        login: Yup.string().required('Username or email is required!'),
        password: Yup.string().required('Password is required!'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();
            const result = await UserDAO.login({
                login: data.login.trim(),
                password: data.password.trim(),
            });
            if (!result.success) throw new Error(result.error || 'Login failed');
            if (result.token) localStorage.setItem('authToken', result.token);
            login({
                id: result.user.id,
                username: result.user.username,
                fullName: result.user.fullName,
                role: result.user.role || 'user',
                email: result.user.email || '',
            });
            message('Welcome back! 👋', 'success');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            message(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            loading.stop();
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4ff' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e0e7ff', borderTopColor: '#1a6ef5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#8a94b2', fontFamily: 'DM Sans, sans-serif' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <div className="login-root">

                {/* ─── LEFT PANEL ─── */}
                <div className="login-left">
                    {/* Brand */}
                    <div className="login-left-brand">
                        <div className="login-left-brand-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                        </div>
                        <span className="login-left-brand-name">InsureSync</span>
                    </div>

                    {/* Main content */}
                    <div className="login-left-content">
                        <div className="login-left-tag">
                            <div className="login-left-tag-dot" />
                            <span>Trusted by 2,400+ agents</span>
                        </div>

                        <h2 className="login-left-headline">
                            Manage your<br />
                            <span>insurance</span><br />
                            portfolio with ease.
                        </h2>
                        <p className="login-left-sub">
                            The all-in-one platform for independent insurance agents — track clients, policies, renewals, and commissions from one place.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="login-left-stats">
                        <div className="login-stat-card">
                            <div className="login-stat-value">98%</div>
                            <div className="login-stat-label">Retention Rate</div>
                        </div>
                        <div className="login-stat-card">
                            <div className="login-stat-value">12k+</div>
                            <div className="login-stat-label">Policies Managed</div>
                        </div>
                        <div className="login-stat-card">
                            <div className="login-stat-value">4.9★</div>
                            <div className="login-stat-label">Agent Rating</div>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT PANEL ─── */}
                <div className="login-right">
                    <div className="login-right-inner">

                        {/* Logo */}
                        <div className="login-right-logo">
                            <div className="login-right-logo-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <span className="login-right-logo-name">InsureSync</span>
                        </div>

                        {/* Title */}
                        <h1 className="login-right-title">Welcome Back</h1>
                        <p className="login-right-sub">Please login to your agent account</p>

                        {/* Form */}
                        <form onSubmit={formik.handleSubmit}>
                            <div className="login-field-group">
                                <div>
                                    <label className="login-field-label">Username or Email</label>
                                    <CustomTextInput
                                        name="login"
                                        fullWidth
                                        placeholder="Enter your username or email"
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
                                        placeholder="Enter your password"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.password}
                                        error={formik.touched.password && Boolean(formik.errors.password)}
                                        helperText={formik.touched.password && formik.errors.password}
                                        type="password"
                                    />
                                </div>
                            </div>

                            <div className="login-forgot">
                                <button type="button" onClick={() => message('Feature coming soon!', 'info')}>
                                    Forgot password?
                                </button>
                            </div>

                            <CustomButton
                                fullWidth
                                type="submit"
                                disabled={!formik.isValid || formik.isSubmitting}
                                className="login-submit-btn"
                            >
                                {formik.isSubmitting ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                        <svg style={{ animation: 'spin 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign In'}
                            </CustomButton>
                        </form>

                        {/* Sign up */}
                        <div className="login-signup-link">
                            Don't have an account?{' '}
                            <button type="button" onClick={() => navigate('/signup')}>Create account</button>
                        </div>

                        {/* Trust badges */}
                        <div className="login-trust-badges">
                            <div className="login-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0abc8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>256-bit Encrypted</span>
                            </div>
                            <div className="login-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0abc8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <span>SOC 2 Compliant</span>
                            </div>
                            <div className="login-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0abc8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>OJK Registered</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
}