import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Card } from 'react-bootstrap';

function PaginaCliente() {
  const [userData, setUserData] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) {
          throw new Error('No se encontró ID de usuario');
        }

        const response = await axios.get(`http://localhost:3000/usuario/${userId}`);
        
        if (!response.data.user) {
          throw new Error('Usuario no encontrado en el sistema');
        }

        setUserData(response.data.user);
        setGardens(response.data.gardens || []);
        setError('');

      } catch (error) {
        setError(`Error al cargar datos: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Bienvenido a tu Área Personal</h1>
      
      {loading && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando tus datos...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {userData && (
        <Card className="mb-4 shadow">
          <Card.Body>
            <Card.Title className="text-primary">
              <i className="bi bi-person-circle me-2"></i>
              Tus Datos
            </Card.Title>
            
            <div className="row">
              <div className="col-md-6">
                <p><strong>Nombre:</strong> {userData.nombre}</p>
                <p><strong>Email:</strong> {userData.email}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Rol:</strong> {userData.rol}</p>
                <p><strong>Registro:</strong> {new Date(userData.fecha_registro).toLocaleDateString()}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="shadow">
        <Card.Body>
          <Card.Title className="text-primary">
            <i className="bi bi-flower2 me-2"></i>
            Tus Jardines
          </Card.Title>

          {gardens.length > 0 ? (
            <div className="row row-cols-1 row-cols-md-2 g-4">
              {gardens.map((garden) => (
                <div key={garden.id} className="col">
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Subtitle className="mb-3 text-muted">
                        Jardín #{garden.id}
                      </Card.Subtitle>
                      
                      <p>
                        <i className="bi bi-geo-alt me-2"></i>
                        <strong>Ubicación:</strong> {garden.ubicacion}
                      </p>
                      
                      <p className={garden.estado_riego === 'regando' ? 'text-success' : 'text-warning'}>
                        <i className="bi bi-droplet me-2"></i>
                        <strong>Estado riego:</strong> {garden.estado_riego}
                      </p>
                      
                      {garden.configuracion_id && (
                        <p>
                          <i className="bi bi-gear me-2"></i>
                          <strong>Configuración:</strong> {garden.configuracion_id}
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <Alert variant="info" className="text-center">
                No tienes jardines registrados
              </Alert>
            )
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default PaginaCliente;