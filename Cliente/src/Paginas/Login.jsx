import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import logo from '../Recursos/logoOasisSL.png';


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

      localStorage.setItem('userId', response.data.usuario_id);

      // Manejo de redirección por rol
      switch(response.data.rol) {
        case 'cliente':
          navigate('/PaginaCliente');
          break;
        case 'admin':
          navigate('/PaginaCliente');
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
    <div className="login-container d-flex align-items-center min-vh-100">
      <Card className="w-100 shadow" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Card.Body>
          <div className="text-center mb-4">
            <img 
              src={logo} 
              alt="Logo" 
              style={{ width: '150px' }}
            />
          </div>
          
          <Card.Title className="text-center mb-4 h3 text-primary">
            Acceso al Sistema
          </Card.Title>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="nombre@ejemplo.com"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Form.Group>

            {error && <Alert variant="danger" className="text-center">{error}</Alert>}

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
            >
              Ingresar
            </Button>

            <div className="text-center small text-muted mt-4">
              ¿No tienes cuenta? <a href="/registro" className="text-warning">Regístrate</a>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;