import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores anteriores
    
    try {
      // Validación básica de campos
      if (!email || !password) {
        setError('Por favor complete todos los campos');
        return;
      }

      const response = await axios.post('http://localhost:3000/login', {
        email,
        password // Envía la contraseña en texto plano
      });

      // Manejo de redirección por rol
      switch(response.data.rol) {
        case 'cliente':
          navigate('/dashboard-cliente');
          break;
        case 'admin':
          navigate('/dashboard-admin');
          break;
        default:
          setError('Rol de usuario no reconocido');
      }

    } catch (err) {
      // Manejo detallado de errores
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         'Error de conexión';
      setError(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="login-container">
      <h2>Acceso al Sistema</h2>
      <form onSubmit={handleSubmit} className="login-form">
        
        <div className="input-group">
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            autoComplete="username"
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="login-button">
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}

export default Login;