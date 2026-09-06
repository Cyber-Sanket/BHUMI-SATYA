import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@bhumisatya.gov.in');
  const [password, setPassword] = useState('AdminPass123!');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = location.state?.from;
  const fromPath = typeof rawFrom === 'string' ? rawFrom : rawFrom?.pathname;
  const targetPath = (fromPath && fromPath !== '/login') ? fromPath : '/';

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, targetPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email address and password.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await login(email.trim(), password);
      setFormError('');
      navigate(targetPath, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@bhumisatya.gov.in');
    setPassword('AdminPass123!');
    setFormError('');
  };

  const fillDemoField = () => {
    setEmail('field1@bhumisatya.gov.in');
    setPassword('FieldPass123!');
    setFormError('');
  };

  return (
    <div className="min-h-screen w-full theme-bg-app theme-text-primary flex flex-col justify-between items-center p-4 select-none font-sans">
      
      {/* Top Banner Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b-2 theme-border pb-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono font-bold text-sm flex items-center justify-center rounded-[2px]">
            BS
          </div>
          <div>
            <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block font-bold">
              GOVERNMENT CADASTRAL SURVEY SYSTEM
            </span>
            <h1 className="text-sm font-extrabold theme-text-primary tracking-tight uppercase">
              BHUMI-SATYA INTEGRITY WORKSTATION
            </h1>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] theme-text-secondary">
          <span className="font-bold block theme-text-primary">[SECURITY LAYER]</span>
          <span>DILRMP COMPLIANT v1.0</span>
        </div>
      </div>

      {/* Main Login Card Panel */}
      <div className="w-full max-w-md my-auto">
        <div className="inst-panel shadow-lg space-y-0">
          
          {/* Card Header */}
          <div className="theme-bg-secondary p-4 border-b theme-border flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] theme-text-secondary uppercase block font-sans font-bold">
                AUTHENTICATION PORTAL
              </span>
              <h2 className="text-sm font-bold theme-text-primary">OFFICER SIGN IN</h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold border theme-border theme-bg-surface theme-text-primary rounded-[2px]">
              RESTRICTED ACCESS
            </span>
          </div>

          {/* Form Content */}
          <div className="p-5 space-y-4 font-mono text-xs">
            <p className="text-[11px] theme-text-secondary font-sans leading-relaxed">
              Sign in with your government surveyor or administrator credentials to access the Nagpur Metro Line 3 acquisition workspace.
            </p>

            {formError && (
              <div className="p-3 badge-blocked text-xs flex items-start gap-2 rounded-[2px] font-mono">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">{formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase theme-text-secondary mb-1">
                  OFFICIAL EMAIL / USERNAME
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 theme-text-secondary" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="officer@bhumisatya.gov.in"
                    className="w-full pl-9 pr-3 py-2 theme-bg-surface border theme-border theme-text-primary text-xs font-mono rounded-[2px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase theme-text-secondary mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 theme-text-secondary" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 theme-bg-surface border theme-border theme-text-primary text-xs font-mono rounded-[2px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 rounded-[2px]"
              >
                {submitting ? (
                  <span>AUTHENTICATING SYSTEM...</span>
                ) : (
                  <>
                    <span>SIGN IN TO WORKSTATION</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-3 border-t theme-border space-y-2">
              <span className="text-[10px] font-bold uppercase theme-text-secondary block">
                DEMO PRESET CREDENTIALS:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="p-2 theme-bg-secondary border theme-border hover:opacity-80 text-left font-mono theme-text-primary flex flex-col justify-between"
                >
                  <span className="font-bold theme-text-primary">ADMIN OFFICER</span>
                  <span className="theme-text-secondary text-[9px] truncate">admin@bhumisatya.gov.in</span>
                </button>

                <button
                  type="button"
                  onClick={fillDemoField}
                  className="p-2 theme-bg-secondary border theme-border hover:opacity-80 text-left font-mono theme-text-primary flex flex-col justify-between"
                >
                  <span className="font-bold theme-text-primary">FIELD SURVEYOR</span>
                  <span className="theme-text-secondary text-[9px] truncate">field1@bhumisatya.gov.in</span>
                </button>
              </div>
            </div>

          </div>

          {/* Footer Info */}
          <div className="theme-bg-secondary p-3 border-t theme-border text-[10px] font-mono theme-text-secondary flex justify-between">
            <span>SECURITY LEVEL: HIGH</span>
            <span>JWT ENCRYPTED</span>
          </div>

        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="w-full max-w-4xl border-t theme-border pt-2 text-[10px] font-mono theme-text-secondary flex flex-wrap justify-between">
        <span>BHUMI-SATYA DEPLOYMENT • NAGPUR METRO LINE 3</span>
        <span>AUTHORITY: STATE LAND RECORDS DEPT</span>
      </div>

    </div>
  );
}
