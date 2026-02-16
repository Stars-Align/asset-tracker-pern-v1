import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function AuthSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Save token to localStorage
            localStorage.setItem('token', token);

            // Fetch user data with the token
            api.get('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        // Save user data
                        localStorage.setItem('user', JSON.stringify(data.data));

                        // Redirect to home immediately (Hard Reload to update App state)
                        window.location.href = '/';
                    } else {
                        throw new Error('Failed to fetch user data');
                    }
                })
                .catch(error => {
                    console.error('Auth error:', error);
                    // Redirect to login on error
                    navigate('/auth');
                });
        } else {
            // No token found, redirect to login
            navigate('/auth');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-center items-center p-6 font-sans text-slate-900">
            <div className="w-full max-w-sm bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Authentication Successful!</h1>
                <p className="text-slate-400 font-bold text-sm mb-6">Redirecting you to your dashboard...</p>
                <Loader2 className="animate-spin text-primary mx-auto" size={32} />
            </div>
        </div>
    );
}
