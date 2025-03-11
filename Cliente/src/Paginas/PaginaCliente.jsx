import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Card, ProgressBar, Row, Col } from 'react-bootstrap';

function PaginaCliente() {
  const [userData, setUserData] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [sensorData, setSensorData] = useState(null);
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

    const fetchSensorData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/sensores/tiempoReal');
        setSensorData(response.data);
      } catch (error) {
        console.error('Error obteniendo datos de sensores:', error);
      }
    };

    // Cargar datos iniciales
    fetchUserData();
    fetchSensorData();

    // Configurar intervalos de actualización
    const sensorInterval = setInterval(fetchSensorData, 60000);
    
    return () => {
      clearInterval(sensorInterval);
    };
  }, [userId]);

  const getProgressVariant = (value, max = 100) => {
    const percentage = (value / max) * 100;
    if (percentage < 30) return 'danger';
    if (percentage < 60) return 'warning';
    return 'success';
  };

  const SensorDisplay = () => (
    <Card className="mb-4 shadow">
      <Card.Body>
        <Card.Title className="text-primary">
          <i className="bi bi-speedometer2 me-2"></i>
          Estado del Sistema en Tiempo Real
        </Card.Title>

        <Row className="g-4">
          <Col md={6} lg={4}>
            <div className="sensor-card">
              <h5><i className="bi bi-droplet-fill text-info me-2"></i>Nivel de Agua</h5>
              <ProgressBar 
                now={sensorData.nivelAgua} 
                max={500} 
                variant={getProgressVariant(sensorData.nivelAgua, 500)}
                label={`${sensorData.nivelAgua}ml`}
              />
              <small className="text-muted">Capacidad máxima: 500ml</small>
            </div>
          </Col>

          <Col md={6} lg={4}>
            <div className="sensor-card">
              <h5><i className="bi bi-moisture text-success me-2"></i>Humedad Suelo</h5>
              <ProgressBar 
                now={sensorData.humedadSuelo} 
                variant={getProgressVariant(sensorData.humedadSuelo)}
                label={`${sensorData.humedadSuelo}%`}
              />
            </div>
          </Col>

          <Col md={6} lg={4}>
            <div className="sensor-card">
              <h5><i className="bi bi-cloud-rain text-primary me-2"></i>Humedad Aire</h5>
              <ProgressBar 
                now={sensorData.humedadAire} 
                variant={getProgressVariant(sensorData.humedadAire)}
                label={`${sensorData.humedadAire}%`}
              />
            </div>
          </Col>

          <Col md={6} lg={4}>
            <div className="sensor-card">
              <h5><i className="bi bi-thermometer-half text-danger me-2"></i>Temperatura</h5>
              <h3 className="text-center">
                {sensorData.tempC}°C
              </h3>
            </div>
          </Col>

          <Col md={6} lg={4}>
            <div className="sensor-card">
              <h5><i className="bi bi-gear-fill text-secondary me-2"></i>Posición Servo</h5>
              <div className="text-center display-4">
                {sensorData.posicionServo}°
                <div className="text-muted" style={{fontSize: '1rem'}}>
                  (0° = cerrado, 180° = abierto)
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

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
        <>
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

          {sensorData ? (
            <SensorDisplay />
          ) : (
            <Alert variant="info" className="text-center mb-4">
              Cargando datos de sensores...
            </Alert>
          )}
        </>
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