import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Button, Row, Col, Alert } from 'react-bootstrap';

function Tienda() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/tabla/Productos');
        setProductos(response.data);
      } catch (error) {
        console.error('Error al obtener productos:', error);
      }
    };

    fetchProductos();
  }, []);

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const realizarCompra = async () => {
    if (carrito.length === 0) {
      setMensaje('El carrito está vacío.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/comprar', {
        userId,
        productos: carrito,
      });

      if (response.data.success) {
        setMensaje('Compra realizada con éxito.');
        setCarrito([]);
      } else {
        setMensaje('Error al realizar la compra.');
      }
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      setMensaje('Error al realizar la compra.');
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <h1 className="display-5 fw-bold text-primary text-center mb-4">
        <i className="bi bi-cart-fill me-2"></i>
        Tienda
      </h1>

      {mensaje && (
        <Alert variant="info" className="text-center">
          {mensaje}
        </Alert>
      )}

      <Row className="g-4">
        {productos.map((producto) => (
          <Col key={producto.producto_id} md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <Card.Title>{producto.nombre}</Card.Title>
                <Card.Text>{producto.descripcion}</Card.Text>
                <Card.Text>
                  <strong>Precio:</strong> ${producto.precio}
                </Card.Text>
                <Button variant="primary" onClick={() => agregarAlCarrito(producto)}>
                  Agregar al Carrito
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="text-center mt-5">
        <Button variant="success" onClick={realizarCompra}>
          Realizar Compra
        </Button>
      </div>
    </div>
  );
}

export default Tienda;