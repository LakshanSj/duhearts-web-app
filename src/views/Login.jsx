import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loginWithUsername, signupWithUsername } from '../firebase';
import { createUserProfile, getUserProfile } from '../services/userService';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || (!isLogin && !confirmPassword.trim())) {
      if (window.showAlert) window.showAlert('Please fill in all fields.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      if (window.showAlert) window.showAlert('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      if (window.showAlert) window.showAlert('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginWithUsername(username, password);
      } else {
        const user = await signupWithUsername(username, password);
        await createUserProfile(user.uid, username);
      }
    } catch (err) {
      if (window.showAlert) {
        let errMessage = 'An error occurred';
        if (err.code === 'auth/invalid-credential') errMessage = 'Invalid username or password.';
        if (err.code === 'auth/email-already-in-use') errMessage = 'Username already taken.';
        window.showAlert(errMessage);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-center animate-in" style={{ width: '100%', flex: 1, flexDirection: 'column', padding: '1rem 0' }}>
        <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            {isLogin ? 'Welcome Back 💖' : 'Join DuoHearts ✨'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Username</label>
              <input 
                type="text" 
                className="input-field" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. loverboy"
                style={{ width: '100%', boxSizing: 'border-box' }}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="input-field" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Confirm Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="input-field" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}
            
            <button type="submit" className="gradient-btn" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Create Account' : 'Back to Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
