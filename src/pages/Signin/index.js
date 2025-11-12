// index.js (SignIn)
import React, { useEffect, useState } from 'react';
import logo from '../../assets/images/logo.png';
import { useContext } from 'react';
import { MyContext } from '../../App';
import { MdEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { IoMdArrowBack } from 'react-icons/io';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './signin.css';
import { databaseService } from '../../services/supabase';

const SignIn = () => {
    const context = useContext(MyContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        context.setIshideSidebar(true);
        return () => {
            context.setIshideSidebar(false);
        };
    }, [context]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            // 1. Check user_perms for email
            const { data: userPerm, error: permError } = await databaseService.getUserByEmail(email);
            if (permError || !userPerm) {
                setError('Email not found or not allowed.');
                return;
            }
            // 2. Check password
            if (userPerm.password !== password) {
                setError('Incorrect password.');
                return;
            }
            // 3. Proceed with sign in local state/context
            if (context.setIsSignIn) context.setIsSignIn(true);
            if (context.setUsername) context.setUsername(userPerm.name); // for header
            if (context.setUserEmail) context.setUserEmail(email);

            // NEW: set role & permissions
            if (context.setUserRole) context.setUserRole(userPerm.role || 'Employee');
            if (context.setUserPermissions) context.setUserPermissions(userPerm.permission_roles || {});

            // Persist this tab's session only
            try {
                const authUser = {
                    name: userPerm.name,
                    email,
                    role: userPerm.role || 'Employee',
                    permissions: userPerm.permission_roles || {}
                };
                sessionStorage.setItem('authUser', JSON.stringify(authUser));
                // Optional cleanup of legacy storage
                try { localStorage.removeItem('authUser'); } catch (_) {}
            } catch (e) {
                console.error('Failed to persist auth user in sessionStorage:', e);
            }

            // 🔗 Migrate guest chat history to logged-in user
            try {
                const guestHistoryRaw = localStorage.getItem('unified_chatHistory_guest');
                if (guestHistoryRaw) {
                    const guestHistory = JSON.parse(guestHistoryRaw);
                    if (Array.isArray(guestHistory) && guestHistory.length > 0) {
                        const userKey = `unified_chatHistory_${email}`;
                        const existingRaw = localStorage.getItem(userKey);
                        const existing = existingRaw ? JSON.parse(existingRaw) : [];
                        const merged = [...existing, ...guestHistory];
                        localStorage.setItem(userKey, JSON.stringify(merged));
                        localStorage.removeItem('unified_chatHistory_guest'); // cleanup
                    }
                }
            } catch (e) {
                console.error("Failed to migrate guest chat history:", e);
            }

            // Log employee login event
            await databaseService.logEmployeeLogin({ email, name: userPerm.name, password });
            navigate('/dashboard');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-section">
            <div className="animated-background">
                <div className="floating-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
            </div>

            <div className='header-section'>
                        <div className='back-button' onClick={() => navigate(-1)} title="Back">
                            <IoMdArrowBack />
                        </div>
                    </div>
            
            <div className='login-container'>
                <div className='login-box'>
                    
                    <div className='logo-section'>
                        <div className='logo-container'>
                            <img src={logo} alt="logo" className='logo-image' />
                        </div>
                        <h2 className='welcome-text'>Welcome Back</h2>
                    </div>
                    
                    <div className='form-section'>
                        <form onSubmit={handleLogin} className='login-form'>
                            <div className='glassmorphism-input-group'>
                                <div className='glassmorphism-input-container'>
                                    <span className='glassmorphism-icon'><MdEmail /></span>
                                    <input 
                                        type='email' 
                                        className='glassmorphism-input' 
                                        id='email' 
                                        placeholder='Username' 
                                        autoFocus 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className='glassmorphism-input-group'>
                                <div className='glassmorphism-input-container'>
                                    <span className='glassmorphism-icon'><RiLockPasswordLine /></span>
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        className='glassmorphism-input' 
                                        id='password' 
                                        placeholder='Password' 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        required
                                    />
                                    <button 
                                        type='button' 
                                        className='glassmorphism-password-toggle' 
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            
                            {error && (
                                <div className='error-message'>
                                    <span className='error-icon'>⚠</span>
                                    {error}
                                </div>
                            )}
                            
                            <button 
                                className={`login-button ${isLoading ? 'loading' : ''}`} 
                                type='submit'
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className='loading-spinner'>
                                        <div className='spinner'></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignIn;
