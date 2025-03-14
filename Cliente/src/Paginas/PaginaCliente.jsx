import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Row, Col, Badge, Form, Button, Modal } from 'react-bootstrap';
import { RadialBarChart, RadialBar, LineChart, Line, ResponsiveContainer, PolarAngleAxis, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function PaginaCliente() {
  const [userData, setUserData] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [sensorData, setSensorData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  
  // Estado para el formulario de edición
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({ nombre: '', email: '' });
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) throw new Error('No se encontró ID de usuario');
        const response = await axios.get(`http://localhost:3000/usuario/${userId}`);
        setUserData(response.data.user);
        // Inicializar el formulario con los datos actuales
        setEditFormData({
          nombre: response.data.user.nombre,
          email: response.data.user.email
        });
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

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);
    
    try {
      const response = await axios.put(`http://localhost:3000/usuario/${userId}`, editFormData);
      
      if (response.data.success) {
        // Actualizar el estado local con los nuevos datos
        setUserData(prev => ({
          ...prev,
          ...editFormData
        }));
        setUpdateSuccess(true);
        
        // Cerrar el modal después de 1.5 segundos
        setTimeout(() => {
          setShowEditForm(false);
          setUpdateSuccess(false);
        }, 1500);
      }
    } catch (error) {
      setUpdateError(`Error al actualizar: ${error.response?.data?.error || error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const renderGauge = (value, max, title, color, unit = '', icon) => {
    const data = [{ value: Math.min(value, max), fill: color }];
    const percentage = (value / max) * 100;
    
    // Determine color based on percentage for better visual feedback
    let statusColor = color;
    if (title.includes('Agua') || title.includes('Humedad')) {
      statusColor = percentage < 30 ? '#dc3545' : percentage < 70 ? '#ffc107' : '#28a745';
    }
    
    return (
      <div className="text-center gauge-container">
        <h5 className="mb-3">
          {icon && <i className={`bi ${icon} me-2`}></i>}
          {title}
        </h5>
        <ResponsiveContainer width="100%" height={150}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={-180}
          >
            <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
            <RadialBar 
              background 
              dataKey="value" 
              cornerRadius={10} 
              fill={statusColor} 
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={22}
              fontWeight="bold"
              fill={statusColor}
            >
              {`${value}${unit}`}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
        <small className="text-muted">Máximo: {max}{unit}</small>
      </div>
    );
  };

  // Modal para editar datos
  const renderEditModal = () => (
    <Modal 
      show={showEditForm} 
      onHide={() => setShowEditForm(false)}
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>
          Editar Datos de Usuario
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {updateSuccess && (
            <Alert variant="success" className="mb-3">
              <i className="bi bi-check-circle me-2"></i>
              ¡Datos actualizados correctamente!
            </Alert>
          )}
          
          {updateError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {updateError}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={editFormData.nombre}
              onChange={handleInputChange}
              required
              disabled={updating}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={editFormData.email}
              onChange={handleInputChange}
              required
              disabled={updating}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button 
            variant="secondary" 
            onClick={() => setShowEditForm(false)}
            disabled={updating}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={updating}
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Actualizando...
              </>
            ) : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  return (
    <div className="container mt-4 mb-5">
      {renderEditModal()}
      
      <Card className="shadow-lg border-0 rounded-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-primary ">
              <i className="bi bi-flower1 me-2"></i>
              Tu Jardín Inteligente
            </h1>
            <p className="lead text-muted">Monitorea y controla tus espacios verdes</p>
          </div>

          {loading && (
            <div className="text-center my-5 py-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3 text-muted">Cargando tus datos...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="text-center my-4 shadow-sm">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {userData && (
            <>
              {/* Sección Perfil de Usuario */}
              <Card className="mb-4 shadow-sm border-0 bg-light">
                <Card.Body className="p-4">
                  <Card.Title as="h2" className="mb-4 text-primary border-bottom pb-2 d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-person-circle me-2"></i>
                      Perfil de Usuario
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowEditForm(true)}
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Editar Perfil
                    </Button>
                  </Card.Title>
                  
                  <Row className="g-4">
                    <Col md={6} className="d-flex">
                      <div className="bg-dark text-white rounded-circle p-3 me-3 shadow-sm">
                        <i className="bi bi-person-fill fs-3"></i>
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Nombre</h6>
                        <h5>{userData.nombre}</h5>
                      </div>
                    </Col>
                    
                    <Col md={6} className="d-flex">
                      <div className="bg-dark text-white rounded-circle p-3 me-3 shadow-sm">
                        <i className="bi bi-envelope-fill fs-3"></i>
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Email</h6>
                        <h5>{userData.email}</h5>
                      </div>
                    </Col>
                    
                    <Col md={6} className="d-flex">
                      <div className="bg-dark text-white rounded-circle p-3 me-3 shadow-sm">
                        <i className="bi bi-person-badge-fill fs-3"></i>
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Rol</h6>
                        <h5><Badge bg="primary" pill>{userData.rol}</Badge></h5>
                      </div>
                    </Col>
                    
                    <Col md={6} className="d-flex">
                      <div className="bg-dark text-white rounded-circle p-3 me-3 shadow-sm">
                        <i className="bi bi-calendar-check-fill fs-3"></i>
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Miembro desde</h6>
                        <h5>{new Date(userData.fecha_registro).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</h5>
                      </div>
                    </Col>
                    <Col md={12} className="text-center mt-3">
                      <button className="btn btn-outline-primary" onClick={() => navigate('/Tienda')}>
                        <i className="bi bi-pencil me-2"></i>
                        Tienda
                      </button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Sección Sensores */}
              {sensorData ? (
                <>
                  <Card className="mb-4 shadow-sm border-0 bg-light">
                    <Card.Body className="p-4">
                      <Card.Title as="h2" className="mb-4 text-primary border-bottom pb-2">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Monitoreo en Tiempo Real
                      </Card.Title>

                      <Row className="g-4">
                        <Col md={6} lg={3}>
                          <Card className="h-100 border-0 shadow-sm hover-card">
                            <Card.Body>
                              {renderGauge(sensorData.nivelAgua, 500, 'Nivel de Agua', '#17a2b8', 'ml', 'bi-droplet-fill')}
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col md={6} lg={3}>
                          <Card className="h-100 border-0 shadow-sm hover-card">
                            <Card.Body>
                              {renderGauge(sensorData.humedadSuelo, 100, 'Humedad Suelo', '#28a745', '%', 'bi-moisture')}
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col md={6} lg={3}>
                          <Card className="h-100 border-0 shadow-sm hover-card">
                            <Card.Body>
                              {renderGauge(sensorData.humedadAire, 100, 'Humedad Aire', '#007bff', '%', 'bi-cloud-fill')}
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col md={6} lg={3}>
                          <Card className="h-100 border-0 shadow-sm hover-card">
                            <Card.Body className="text-center d-flex flex-column justify-content-center">
                              <h5 className="mb-3">
                                <i className="bi bi-thermometer-half text-danger me-2"></i>
                                Temperatura
                              </h5>
                              <div className="display-2 my-3 fw-bold" style={{ 
                                color: sensorData.tempC > 30 ? '#dc3545' : 
                                      sensorData.tempC > 20 ? '#fd7e14' : 
                                      sensorData.tempC > 10 ? '#28a745' : '#17a2b8' 
                              }}>
                                {sensorData.tempC}°C
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Gráfico Histórico */}
                  <Card className="mb-4 shadow-sm border-0 bg-light">
                    <Card.Body className="p-4">
                      <Card.Title as="h2" className="mb-4 text-primary border-bottom pb-2">
                        <i className="bi bi-clock-history me-2"></i>
                        Datos Históricos <small className="text-muted">(últimas 24 horas)</small>
                      </Card.Title>
                      
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis 
                            dataKey="hora" 
                            tick={{ fill: '#666' }}
                            axisLine={{ stroke: '#ccc' }}
                          />
                          <YAxis 
                            yAxisId="left" 
                            tick={{ fill: '#666' }}
                            axisLine={{ stroke: '#ccc' }}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right"
                            tick={{ fill: '#666' }}
                            axisLine={{ stroke: '#ccc' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: 'none', 
                              boxShadow: '0 0 10px rgba(0,0,0,0.1)' 
                            }} 
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle"
                          />
                          
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="tempC"
                            name="Temperatura (°C)"
                            stroke="#dc3545"
                            strokeWidth={3}
                            dot={{ fill: '#dc3545', strokeWidth: 2, r: 0 }}
                            activeDot={{ r: 6 }}
                          />
                          
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="humedadAire"
                            name="Humedad Aire (%)"
                            stroke="#007bff"
                            strokeWidth={3}
                            dot={{ fill: '#007bff', strokeWidth: 2, r: 0 }}
                            activeDot={{ r: 6 }}
                          />
                          
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="humedadSuelo"
                            name="Humedad Suelo (%)"
                            stroke="#28a745"
                            strokeWidth={3}
                            dot={{ fill: '#28a745', strokeWidth: 2, r: 0 }}
                            activeDot={{ r: 6 }}
                          />
                          
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="nivelAgua"
                            name="Nivel Agua (ml)"
                            stroke="#17a2b8"
                            strokeWidth={3}
                            dot={{ fill: '#17a2b8', strokeWidth: 2, r: 0 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </>
              ) : (
                <Alert variant="info" className="text-center mb-4 shadow-sm">
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="spinner-border text-info me-3" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span>Cargando datos de sensores...</span>
                  </div>
                </Alert>
              )}

              {/* Sección Jardines */}
              <Card className="shadow-sm border-0 bg-light">
                <Card.Body className="p-4">
                  <Card.Title as="h2" className="mb-4 text-primary border-bottom pb-2">
                    <i className="bi bi-flower2 me-2"></i>
                    Tus Jardines Inteligentes
                  </Card.Title>

                  {gardens.length > 0 ? (
                    <Row className="row-cols-1 row-cols-md-2 g-4">
                      {gardens.map((garden) => (
                        <Col key={garden.id}>
                          <Card className="h-100 border-0 shadow-sm hover-card">
                            <Card.Body className="p-4">
                              <div className="garden-header d-flex align-items-center mb-3">
                                <div className="garden-icon bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                                  <i className="bi bi-tree-fill fs-3"></i>
                                </div>
                                <div>
                                  <Card.Subtitle className="text-muted mb-0">
                                    Jardín #{garden.id}
                                  </Card.Subtitle>
                                  <h4 className="mt-1 garden-name">
                                    {garden.ubicacion}
                                  </h4>
                                </div>
                              </div>
                              
                              <div className="garden-stats mt-4">
                                <div className="d-flex align-items-center mb-3">
                                  <div className={`status-indicator ${garden.estado_riego === 'regando' ? 'bg-success' : 'bg-warning'} rounded-circle me-3`} style={{ width: '12px', height: '12px' }}></div>
                                  <div>
                                    <small className="text-muted d-block">Estado de riego</small>
                                    <strong className={garden.estado_riego === 'regando' ? 'text-success' : 'text-warning'}>
                                      {garden.estado_riego === 'regando' ? 'Regando activamente' : 'En espera'}
                                    </strong>
                                  </div>
                                </div>
                                
                                {garden.configuracion_id && (
                                  <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                                      <i className="bi bi-gear-fill text-primary"></i>
                                    </div>
                                    <div>
                                      <small className="text-muted d-block">Configuración</small>
                                      <strong>Plan #{garden.configuracion_id}</strong>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="garden-actions mt-4 pt-3 border-top">
                                <button className="btn btn-outline-primary me-2" onClick={() => navigate(`/DetallesJardin/${garden.id}`)}>
                                  <i className="bi bi-graph-up me-2"></i>
                                  Detalles
                                </button>
                                <button className="btn btn-outline-success">
                                  <i className="bi bi-droplet me-2"></i>
                                  {garden.estado_riego === 'regando' ? 'Detener riego' : 'Iniciar riego'}
                                </button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    !loading && (
                      <div className="text-center py-5 my-3">
                        <i className="bi bi-flower3 text-muted" style={{ fontSize: '4rem' }}></i>
                        <h5 className="mt-3 mb-2">No tienes jardines registrados</h5>
                        <p className="text-muted mb-4">Comienza registrando tu primer jardín inteligente</p>
                        <button className="btn btn-primary">
                          <i className="bi bi-plus-circle me-2"></i>
                          Añadir nuevo jardín
                        </button>
                      </div>
                    )
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Card.Body>
      </Card>

      <style jsx="true">{`
        .gradient-text {
          background: linear-gradient(45deg, #1a8754, #17a2b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #17a2b8, #28a745);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #1a8754;
        }
      `}</style>
    </div>
  );
}

export default PaginaCliente;