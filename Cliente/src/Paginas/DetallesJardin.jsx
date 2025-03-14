import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Alert, Spinner, Form, Row, Col, Badge } from 'react-bootstrap';

function DetallesJardin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);
  const [configuracion, setConfiguracion] = useState(null);
  const [formData, setFormData] = useState({});
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const [gardenRes, configRes] = await Promise.all([
          axios.get(`http://localhost:3000/jardin/${id}?userId=${userId}`),
          axios.get(`http://localhost:3000/jardin/${id}/configuracion`)
        ]);
        
        setGarden(gardenRes.data);
        setConfiguracion(configRes.data);
        setFormData(configRes.data);
      } catch (err) {
        setError('Error al cargar los datos del jardín');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:3000/jardin/${id}/configuracion`, formData);
      setConfiguracion(formData);
      setEditando(false);
      setSuccess('Configuración actualizada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al guardar la configuración');
    }
  };

  if (loading) {
    return (
      <div className="container text-center my-5 py-5">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <h5 className="mt-3 text-muted">Cargando detalles del jardín...</h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger" className="text-center shadow-sm">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <Button 
        variant="outline-secondary" 
        onClick={() => navigate(-1)}
        className="mb-4 rounded-pill"
      >
        <i className="bi bi-arrow-left me-2"></i>
        Volver
      </Button>

      <Card className="shadow-lg border-0 rounded-4">
        <Card.Body className="p-4">
          <Card.Title className="text-primary display-5 fw-bold mb-4">
            <i className="bi bi-tree-fill me-3"></i>
            Jardín #{garden.id} - {garden.ubicacion}
          </Card.Title>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm bg-light">
                <Card.Body>
                  <h5 className="text-success mb-3">
                    <i className="bi bi-droplet-fill me-2"></i>
                    Estado de Riego
                  </h5>
                  <Badge 
                    bg={garden.estado_riego === 'regando' ? 'success' : 'warning'} 
                    className="fs-6 p-2 mb-3"
                  >
                    {garden.estado_riego === 'regando' ? 'Regando Activamente' : 'Riego en Espera'}
                  </Badge>
                  <Button 
                    variant={garden.estado_riego === 'regando' ? 'outline-danger' : 'outline-success'} 
                    className="ms-3 rounded-pill"
                  >
                    <i className={`bi ${garden.estado_riego === 'regando' ? 'bi-stop' : 'bi-play'} me-2`}></i>
                    {garden.estado_riego === 'regando' ? 'Detener Riego' : 'Iniciar Riego'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-primary mb-0">
                      <i className="bi bi-gear-fill me-2"></i>
                      Configuración Actual
                    </h5>
                    {!editando && (
                      <Button 
                        variant="outline-warning" 
                        size="sm" 
                        onClick={() => setEditando(true)}
                        className="rounded-pill"
                      >
                        <i className="bi bi-pencil-square me-2"></i>
                        Editar
                      </Button>
                    )}
                  </div>

                  {success && (
                    <Alert variant="success" className="mb-3">
                      <i className="bi bi-check-circle me-2"></i>
                      {success}
                    </Alert>
                  )}

                  {editando ? (
                    <Form>
                      <Row className="g-3">
                        {['temp_min', 'temp_max'].map((field) => (
                          <Col md={6} key={field}>
                            <Form.Group>
                              <Form.Label className="text-muted small">
                                {field.includes('min') ? 'Temp. Mínima' : 'Temp. Máxima'}
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name={field}
                                value={formData[field] || ''}
                                onChange={handleInputChange}
                                className="mb-2"
                              />
                            </Form.Group>
                          </Col>
                        ))}

                        {['humedad_amb_min', 'humedad_amb_max'].map((field) => (
                          <Col md={6} key={field}>
                            <Form.Group>
                              <Form.Label className="text-muted small">
                                {field.includes('min') ? 'Humedad Amb. Mín' : 'Humedad Amb. Máx'}
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name={field}
                                value={formData[field] || ''}
                                onChange={handleInputChange}
                                className="mb-2"
                              />
                            </Form.Group>
                          </Col>
                        ))}

                        {['humedad_suelo_min', 'humedad_suelo_max'].map((field) => (
                          <Col md={6} key={field}>
                            <Form.Group>
                              <Form.Label className="text-muted small">
                                {field.includes('min') ? 'Humedad Suelo Mín' : 'Humedad Suelo Máx'}
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name={field}
                                value={formData[field] || ''}
                                onChange={handleInputChange}
                                className="mb-2"
                              />
                            </Form.Group>
                          </Col>
                        ))}

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="text-muted small">Nivel Agua Mínimo</Form.Label>
                            <Form.Control
                              type="number"
                              name="nivel_agua_min"
                              value={formData.nivel_agua_min || ''}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setEditando(false)}
                          className="rounded-pill"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          variant="primary" 
                          onClick={handleSave}
                          className="rounded-pill"
                        >
                          <i className="bi bi-save me-2"></i>
                          Guardar Cambios
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <Row className="g-3">
                      {Object.entries(configuracion || {}).map(([key, value]) => (
                        <Col md={6} key={key}>
                          <div className="bg-light p-3 rounded-3">
                            <small className="text-muted d-block">{key.replace(/_/g, ' ').toUpperCase()}</small>
                            <span className="fw-bold text-primary">{value}{key.includes('temp') ? '°C' : key.includes('humedad') ? '%' : 'L'}</span>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Nueva sección para mostrar productos comprados */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Body className="p-4">
              <h4 className="text-success mb-4">
                <i className="bi bi-cart-check-fill me-2"></i>
                Productos Comprados para este Jardín
              </h4>

              {garden.productosComprados && garden.productosComprados.length > 0 ? (
                <Row className="g-4">
                  {garden.productosComprados.map((producto) => (
                    <Col md={4} key={producto.id}>
                      <Card className="h-100 hover-card border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="card-title mb-0">{producto.nombre}</h5>
                            <Badge bg="info" pill>
                              {new Date(producto.fecha_compra).toLocaleDateString('es-ES')}
                            </Badge>
                          </div>
                          <Card.Text className="text-muted">
                            {producto.descripcion}
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <Badge bg="success" className="px-3 py-2">
                              {parseFloat(producto.precio).toFixed(2)} €
                            </Badge>
                            <i className={`bi ${producto.nombre.toLowerCase().includes('planta') ? 'bi-flower1' : 'bi-tools'} text-primary fs-4`}></i>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Alert variant="light" className="text-center py-4">
                  <i className="bi bi-bag-x text-muted fs-1 d-block mb-3"></i>
                  <p className="mb-0">No hay productos comprados para este jardín.</p>
                  <Button 
                    variant="outline-primary" 
                    className="mt-3 rounded-pill"
                    onClick={() => navigate('/tienda')}
                  >
                    <i className="bi bi-shop me-2"></i>
                    Ir a la Tienda
                  </Button>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      <style jsx="true">{`
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
        }
        .rounded-4 {
          border-radius: 1rem !important;
        }
      `}</style>
    </div>
  );
}

export default DetallesJardin;