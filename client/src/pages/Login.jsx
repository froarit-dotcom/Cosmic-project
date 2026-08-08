import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const loggedInUser = await login(username, password);
            if (loggedInUser.role === 'EMPLOYEE') {
                navigate('/invoices');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed, please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-['Outfit']">
            {/* Ambient background blur blobs */}
            <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"></div>

            <div className="max-w-md w-full space-y-10 bg-white/70 backdrop-blur-2xl p-10 sm:p-14 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white/60 z-10 relative">
                <div>
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-blue-500 rounded-3xl shadow-lg shadow-indigo-200 flex items-center justify-center mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <LogIn className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-center text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-blue-600">
                        COSMIC
                    </h2>
                    <p className="mt-3 text-center text-sm font-medium text-slate-500 uppercase tracking-widest">
                        Workspace Gateway
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl shadow-sm">
                            <p className="text-sm font-medium text-rose-700">{error}</p>
                        </div>
                    )}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Username</label>
                            <input
                                type="text"
                                required
                                className="appearance-none block w-full px-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all shadow-sm font-medium"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                required
                                className="appearance-none block w-full px-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all shadow-sm font-medium"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 border-2 border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-200 hover:-translate-y-1"
                        >
                            {loading ? 'Authenticating...' : 'Sign In To Workspace'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
