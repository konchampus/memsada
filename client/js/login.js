const { useState, useEffect } = React;

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const savedEmail = localStorage.getItem('savedEmail');
        const savedPassword = localStorage.getItem('savedPassword');
        if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                if (rememberMe) {
                    localStorage.setItem('savedEmail', email);
                    localStorage.setItem('savedPassword', password);
                } else {
                    localStorage.removeItem('savedEmail');
                    localStorage.removeItem('savedPassword');
                }
                window.location.href = '/admin.html';
            } else {
                setError(data.error || 'Ошибка входа');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Ошибка соединения с сервером');
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Вход в админ-панель</h2>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Пароль"
                        required
                    />
                    <label style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                        />
                        <span style={{ marginLeft: '5px' }}>Запомнить меня</span>
                    </label>
                    <button type="submit">Войти</button>
                </form>
            </div>
        </div>
    );
}

ReactDOM.render(<Login />, document.getElementById('root'));