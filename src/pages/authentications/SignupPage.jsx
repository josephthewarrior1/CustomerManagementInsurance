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

    .signup-root * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .signup-root {
        font-family: 'DM Sans', sans-serif;
        min-height: 100vh;
        display: flex;
        background: #f0f4ff;
    }

    /* ─── LEFT PANEL ─── */
    .signup-left {
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

    .signup-left::before {
        content: '';
        position: absolute;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        top: -120px;
        right: -100px;
    }

    .signup-left::after {
        content: '';
        position: absolute;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        bottom: 60px;
        left: -80px;
    }

    .signup-left-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1;
    }

    .signup-left-brand-icon {
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

    .signup-left-brand-name {
        font-family: 'Sora', sans-serif;
        font-weight: 700;
        font-size: 20px;
        color: #fff;
        letter-spacing: -0.3px;
    }

    .signup-left-content {
        z-index: 1;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 48px 0 32px;
    }

    .signup-left-tag {
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

    .signup-left-tag-dot {
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

    .signup-left-tag span {
        font-size: 12px;
        color: rgba(255,255,255,0.9);
        font-weight: 500;
        letter-spacing: 0.3px;
    }

    .signup-left-headline {
        font-family: 'Sora', sans-serif;
        font-size: 38px;
        font-weight: 800;
        color: #fff;
        line-height: 1.15;
        letter-spacing: -1px;
        margin-bottom: 20px;
    }

    .signup-left-headline span {
        position: relative;
        display: inline-block;
    }

    .signup-left-headline span::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 0;
        width: 100%;
        height: 3px;
        background: rgba(255,255,255,0.45);
        border-radius: 2px;
    }

    .signup-left-sub {
        font-size: 15px;
        color: rgba(255,255,255,0.72);
        line-height: 1.65;
        max-width: 320px;
        font-weight: 300;
    }

    .signup-left-checklist {
        margin-top: 32px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 1;
    }

    .signup-check-item {
        display: flex;
        align-items: center;
        gap: 12px;
        color: rgba(255,255,255,0.85);
        font-size: 14px;
        font-weight: 400;
    }

    .signup-check-icon {
        width: 24px;
        height: 24px;
        background: rgba(255,255,255,0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    /* ─── RIGHT PANEL ─── */
    .signup-right {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 64px;
        background: #f0f4ff;
        overflow-y: auto;
    }

    .signup-right-inner {
        width: 100%;
        max-width: 400px;
    }

    .signup-right-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        margin-bottom: 28px;
    }

    .signup-right-logo-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #1a3fa8, #1a6ef5);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .signup-right-logo-name {
        font-family: 'Sora', sans-serif;
        font-weight: 700;
        font-size: 18px;
        color: #1a3fa8;
        letter-spacing: -0.3px;
    }

    .signup-right-title {
        font-family: 'Sora', sans-serif;
        font-size: 28px;
        font-weight: 800;
        color: #0f1b3d;
        text-align: center;
        margin-bottom: 6px;
        letter-spacing: -0.8px;
    }

    .signup-right-sub {
        font-size: 14px;
        color: #8a94b2;
        text-align: center;
        margin-bottom: 28px;
        font-weight: 400;
    }

    .signup-field-group {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 24px;
    }

    .signup-field-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #374163;
        margin-bottom: 6px;
        letter-spacing: 0.1px;
    }

    .signup-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .signup-privacy {
        font-size: 12px;
        color: #a0abc8;
        text-align: center;
        margin-top: 16px;
        line-height: 1.6;
    }

    .signup-privacy a {
        color: #1a6ef5;
        text-decoration: none;
        font-weight: 500;
    }

    .signup-login-link {
        text-align: center;
        margin-top: 20px;
        font-size: 14px;
        color: #8a94b2;
    }

    .signup-login-link button {
        background: none;
        border: none;
        cursor: pointer;
        color: #1a6ef5;
        font-weight: 600;
        font-size: 14px;
        font-family: 'DM Sans', sans-serif;
        padding: 0;
    }

    .signup-login-link button:hover {
        text-decoration: underline;
    }

    /* Mobile */
    @media (max-width: 768px) {
        .signup-left { display: none; }
        .signup-right {
            padding: 36px 24px;
            background: linear-gradient(160deg, #f0f4ff 0%, #e8eeff 100%);
        }
        .signup-row { grid-template-columns: 1fr; }
    }

    /* Submit button */
    .signup-submit-btn {
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

    .signup-submit-btn:hover:not(:disabled) {
        transform: translateY(-1px) !important;
        box-shadow: 0 12px 32px rgba(26, 110, 245, 0.45) !important;
    }

    .signup-submit-btn:disabled {
        opacity: 0.6 !important;
    }

    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .signup-right-inner > * {
        animation: fadeUp 0.5s ease both;
    }
    .signup-right-inner > *:nth-child(1) { animation-delay: 0.05s; }
    .signup-right-inner > *:nth-child(2) { animation-delay: 0.1s; }
    .signup-right-inner > *:nth-child(3) { animation-delay: 0.15s; }
    .signup-right-inner > *:nth-child(4) { animation-delay: 0.2s; }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

export default function SignUpPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const validationSchema = Yup.object({
        fullName: Yup.string().required('Full name is required!').min(2, 'At least 2 characters'),
        username: Yup.string()
            .required('Username is required!')
            .min(4, 'At least 4 characters')
            .matches(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
        email: Yup.string().email('Invalid email format').required('Email is required!'),
        password: Yup.string().required('Password is required!').min(6, 'At least 6 characters'),
        confirmPassword: Yup.string()
            .required('Please confirm your password!')
            .oneOf([Yup.ref('password'), null], 'Passwords must match'),
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
            if (!result.success) throw new Error(result.error || 'Sign up failed');
            if (result.token) localStorage.setItem('authToken', result.token);
            login({
                id: result.user.id,
                username: result.user.username,
                fullName: result.user.fullName,
                role: result.user.role || 'user',
                email: result.user.email || '',
            });
            message('Account created successfully! Welcome aboard! 🎉', 'success');
            navigate('/', { replace: true });
        } catch (error) {
            message(error.message || 'Sign up failed. Please try again.', 'error');
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
            <div className="signup-root">

                {/* ─── LEFT PANEL ─── */}
                <div className="signup-left">
                    <div className="signup-left-brand">
                        <div className="signup-left-brand-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                        </div>
                        <span className="signup-left-brand-name">InsureSync</span>
                    </div>

                    <div className="signup-left-content">
                        <div className="signup-left-tag">
                            <div className="signup-left-tag-dot" />
                            <span>Join 2,400+ independent agents</span>
                        </div>

                        <h2 className="signup-left-headline">
                            Start growing<br />
                            your <span>agency</span><br />
                            smarter today.
                        </h2>
                        <p className="signup-left-sub">
                            Set up your agent profile in minutes and start managing clients, policies, and renewals from one powerful dashboard.
                        </p>
                    </div>

                    <div className="signup-left-checklist">
                        {[
                            'Manage all clients & policies in one place',
                            'Automated renewal reminders & alerts',
                            'Track commissions & performance metrics',
                            'Secure, compliant, and always available',
                        ].map((item, i) => (
                            <div className="signup-check-item" key={i}>
                                <div className="signup-check-icon">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── RIGHT PANEL ─── */}
                <div className="signup-right">
                    <div className="signup-right-inner">

                        <div className="signup-right-logo">
                            <div className="signup-right-logo-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <span className="signup-right-logo-name">InsureSync</span>
                        </div>

                        <h1 className="signup-right-title">Create Account</h1>
                        <p className="signup-right-sub">Join us and protect what matters most</p>

                        <form onSubmit={formik.handleSubmit}>
                            <div className="signup-field-group">
                                {/* Full Name + Username row */}
                                <div className="signup-row">
                                    <div>
                                        <label className="signup-field-label">Full Name</label>
                                        <CustomTextInput
                                            name="fullName"
                                            fullWidth
                                            placeholder="John Doe"
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

                                {/* Email */}
                                <div>
                                    <label className="signup-field-label">Email Address</label>
                                    <CustomTextInput
                                        name="email"
                                        fullWidth
                                        placeholder="john@example.com"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.email}
                                        error={formik.touched.email && Boolean(formik.errors.email)}
                                        helperText={formik.touched.email && formik.errors.email}
                                        type="email"
                                    />
                                </div>

                                {/* Password + Confirm row */}
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
                                            type="password"
                                        />
                                    </div>
                                    <div>
                                        <label className="signup-field-label">Confirm</label>
                                        <CustomTextInput
                                            name="confirmPassword"
                                            fullWidth
                                            placeholder="••••••••"
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.confirmPassword}
                                            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                            type="password"
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
                                        <svg style={{ animation: 'spin 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : 'Create Account'}
                            </CustomButton>

                            <p className="signup-privacy">
                                By creating an account, you agree to our{' '}
                                <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                            </p>
                        </form>

                        <div className="signup-login-link">
                            Already have an account?{' '}
                            <button type="button" onClick={() => navigate('/login')}>Sign in</button>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
}