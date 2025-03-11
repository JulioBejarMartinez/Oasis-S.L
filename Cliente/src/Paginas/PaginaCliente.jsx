import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Card, Row, Col } from 'react-bootstrap';
import { RadialBarChart, RadialBar, LineChart, Line, ResponsiveContainer, PolarAngleAxis, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function PaginaCliente() {
  const [userData, setUserData] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [sensorData, setSensorData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) throw new Error('No se encontró ID de usuario');
        const response = await axios.get(`http://localhost:3000/usuario/${userId}`);
        setUserData(response.data.user);
        setGardens(response.data.gardens || []);
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

    const fetchHistoricalData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/sensores/historico');
        const formattedData = response.data.map(item => ({
          ...item,
          hora: new Date(item.timestamp).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit'
          })
        }));
        setHistoricalData(formattedData);
      } catch (error) {
        console.error('Error obteniendo histórico:', error);
      }
    };

    fetchUserData();
    fetchSensorData();
    fetchHistoricalData();
    
    const sensorInterval = setInterval(() => {
      fetchSensorData();
      fetchHistoricalData();
    }, 60000);

    return () => clearInterval(sensorInterval);
  }, [userId]);

  const renderGauge = (value, max, title, color, unit = '') => {
    const data = [{ value: Math.min(value, max), fill: color }];
    return (
      <div className="text-center">
        <h5 className="mb-3">{title}</h5>
        <ResponsiveContainer width="100%" height={150}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={-180}
          >
            <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={10} fill={color} />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={20}
              fill={color}
            >
              {`${value}${unit}`}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
        <small className="text-muted">Máximo: {max}{unit}</small>
      </div>
    );
  };

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
              
              <Row>
                <Col md={6}>
                  <p><strong>Nombre:</strong> {userData.nombre}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Rol:</strong> {userData.rol}</p>
                  <p><strong>Registro:</strong> {new Date(userData.fecha_registro).toLocaleDateString()}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {sensorData ? (
            <>
              <Card className="mb-4 shadow">
                <Card.Body>
                  <Card.Title className="text-primary mb-4">
                    <i className="bi bi-speedometer2 me-2"></i>
                    Estado en Tiempo Real
                  </Card.Title>

                  <Row className="g-4">
                    <Col md={6} lg={3}>
                      <Card className="h-100">
                        <Card.Body>
                          {renderGauge(sensorData.nivelAgua, 500, 'Nivel de Agua', '#17a2b8', 'ml')}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6} lg={3}>
                      <Card className="h-100">
                        <Card.Body>
                          {renderGauge(sensorData.humedadSuelo, 100, 'Humedad Suelo', '#28a745', '%')}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6} lg={3}>
                      <Card className="h-100">
                        <Card.Body>
                          {renderGauge(sensorData.humedadAire, 100, 'Humedad Aire', '#007bff', '%')}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6} lg={3}>
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <h5><i className="bi bi-thermometer-half text-danger"></i> Temperatura</h5>
                          <div className="display-3 my-3">{sensorData.tempC}°C</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-4 shadow">
                <Card.Body>
                  <Card.Title className="text-primary mb-4">
                    <i className="bi bi-clock-history me-2"></i>
                    Histórico últimas 24 horas
                  </Card.Title>
                  
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="tempC"
                        name="Temperatura (°C)"
                        stroke="#dc3545"
                        strokeWidth={2}
                        dot={false}
                      />
                      
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="humedadAire"
                        name="Humedad Aire (%)"
                        stroke="#007bff"
                        strokeWidth={2}
                        dot={false}
                      />
                      
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="humedadSuelo"
                        name="Humedad Suelo (%)"
                        stroke="#28a745"
                        strokeWidth={2}
                        dot={false}
                      />
                      
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="nivelAgua"
                        name="Nivel Agua (ml)"
                        stroke="#17a2b8"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </>
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
            <Row className="row-cols-1 row-cols-md-2 g-4">
              {gardens.map((garden) => (
                <Col key={garden.id}>
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
                </Col>
              ))}
            </Row>
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