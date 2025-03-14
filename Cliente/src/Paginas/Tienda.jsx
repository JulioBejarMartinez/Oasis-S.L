import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Button, Row, Col, Alert, Badge, Form, Modal, ListGroup } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Tienda() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const url = categoria !== 'todas' 
          ? `http://localhost:3000/tabla/Productos/filtrar?tipo_producto=${categoria}` 
          : 'http://localhost:3000/tabla/Productos';
        
        const response = await axios.get(url);
        setProductos(response.data);
      } catch (error) {
        console.error('Error al obtener productos:', error);
        toast.error('Error al cargar productos');
      }
    };

    fetchProductos();
  }, [categoria]);

  const agregarAlCarrito = (producto) => {
    if (producto.stock > 0) {
      if (!carrito.some(item => item.producto_id === producto.producto_id)) {
        setCarrito([...carrito, producto]);
        toast.success(`${producto.nombre} añadido al carrito`);
      } else {
        toast.info(`${producto.nombre} ya está en el carrito`);
      }
    } else {
      toast.warning(`${producto.nombre} está agotado`);
    }
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.producto_id !== productoId));
    toast.info("Producto eliminado del carrito");
  };

  const realizarCompra = async () => {
    if (!userId) {
      toast.error("Debe iniciar sesión para realizar una compra");
      return;
    }

    if (carrito.length === 0) {
      toast.warning("El carrito está vacío");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Asegurarse de que todos los productos tienen los campos necesarios
      const productosFormateados = carrito.map(item => ({
        producto_id: item.producto_id,
        nombre: item.nombre,
        descripcion: item.descripcion || item.nombre,
        precio: parseFloat(item.precio),
        stock: item.stock
      }));
      
      const response = await axios.post('http://localhost:3000/comprar', {
        userId: parseInt(userId),
        productos: productosFormateados
      });

      if (response.data.success) {
        toast.success('¡Compra realizada con éxito!');
        setCarrito([]);
        setShowModal(false);
        
        // Recargar productos para actualizar el stock
        const url = categoria !== 'todas' 
          ? `http://localhost:3000/tabla/Productos/filtrar?tipo_producto=${categoria}` 
          : 'http://localhost:3000/tabla/Productos';
        const productosActualizados = await axios.get(url);
        setProductos(productosActualizados.data);
      }
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      toast.error(error.response?.data?.message || 'Error al realizar la compra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <Card className="shadow-lg border-0 rounded-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <Card.Body className="p-4">
          <ToastContainer position="bottom-right" autoClose={3000} />
          
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-success">
              <i className="bi bi-shop me-2"></i>
              Tienda Verde
            </h1>
            <p className="lead text-muted">Productos ecológicos para tu jardín</p>
          </div>

          {/* Selector de categoría */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Form.Select 
              className="w-25" 
              onChange={(e) => setCategoria(e.target.value)}
              value={categoria}
            >
              <option value="todas">Todas las categorías</option>
              <option value="planta">Plantas</option>
              <option value="articulo">Artículos</option>
            </Form.Select>

            <Button 
              variant="success" 
              className="rounded-pill"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-cart3 me-2"></i>
              Carrito <Badge bg="light" text="success" className="ms-2">{carrito.length}</Badge>
            </Button>
          </div>

          {/* Listado de productos */}
          {productos.length === 0 ? (
            <Alert variant="info" className="text-center shadow-sm">
              <i className="bi bi-info-circle me-2"></i>
              No hay productos disponibles en esta categoría
            </Alert>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {productos.map((producto) => (
                <Col key={producto.producto_id}>
                  <Card className="h-100 border-0 shadow-sm hover-card">
                    <Card.Body className="p-4 d-flex flex-column">
                      <div className="text-center mb-3">
                        <div className="bg-success bg-opacity-10 rounded-3 p-3">
                          <i className={`bi ${producto.tipo_producto === 'planta' ? 'bi-flower1' : 'bi-tools'} fs-1 text-success`}></i>
                        </div>
                      </div>
                      
                      <Card.Title className="text-success mb-3">{producto.nombre}</Card.Title>
                      <Card.Text className="flex-grow-1 text-muted">
                        {producto.descripcion}
                      </Card.Text>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <Badge bg="success" className="me-2">${producto.precio}</Badge>
                          <Badge bg={producto.stock > 0 ? "info" : "danger"}>
                            {producto.stock > 0 ? `${producto.stock} disponibles` : 'Agotado'}
                          </Badge>
                        </div>
                        <Button 
                          variant={producto.stock > 0 ? "outline-success" : "outline-secondary"} 
                          size="sm"
                          onClick={() => agregarAlCarrito(producto)}
                          disabled={producto.stock === 0}
                        >
                          <i className="bi bi-cart-plus"></i>
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Modal del carrito */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="text-success">
                <i className="bi bi-cart3 me-2"></i>
                Resumen de Compra
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {carrito.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <i className="bi bi-cart-x me-2"></i>
                  El carrito está vacío
                </Alert>
              ) : (
                <>
                  <ListGroup variant="flush">
                    {carrito.map((item) => (
                      <ListGroup.Item key={item.producto_id} className="d-flex justify-content-between align-items-center py-3">
                        <div>
                          <strong className="text-success">{item.nombre}</strong>
                          <div className="text-muted small">${item.precio}</div>
                        </div>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => quitarDelCarrito(item.producto_id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  
                  <div className="mt-4 pt-3 border-top">
                    <h5 className="text-end">
                      Total: <span className="text-success">${carrito.reduce((sum, item) => sum + parseFloat(item.precio), 0).toFixed(2)}</span>
                    </h5>
                  </div>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="outline-secondary" onClick={() => setCarrito([])}>
                Vaciar Carrito
              </Button>
              <Button 
                variant="success" 
                onClick={realizarCompra}
                disabled={carrito.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-credit-card me-2"></i>
                    Finalizar Compra
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </Card.Body>
      </Card>

      <style>{`
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,100,0,0.1) !important;
        }
        .badge {
          font-size: 0.9em;
          padding: 0.5em 0.75em;
        }
      `}</style>
    </div>
  );
}
export default Tienda;