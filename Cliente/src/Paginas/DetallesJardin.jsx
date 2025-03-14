import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';

function DetallesJardin() {
  const { id } = useParams(); // Obtener el ID del jardín desde la URL
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGardenDetails = async () => {
      try {
        const userId = localStorage.getItem('userId'); // Obtener userId del localStorage
        const response = await axios.get(`http://localhost:3000/jardin/${id}?userId=${userId}`);
        setGarden(response.data);
      } catch (err) {
        setError('Error al cargar los detalles del jardín.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchGardenDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando detalles del jardín...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center">
        {error}
      </Alert>
    );
  }

  return (
    <div className="container mt-4">
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4">
        Volver
      </Button>
      <Card className="shadow-lg">
        <Card.Body>
          <Card.Title className="text-primary">
            Jardín #{garden.id} - {garden.ubicacion}
          </Card.Title>
          <Card.Text>
            <strong>Estado de riego:</strong> {garden.estado_riego === 'regando' ? 'Regando' : 'En espera'}
          </Card.Text>
          <Card.Text>
            <strong>Configuración:</strong> {garden.configuracion_id ? `Plan #${garden.configuracion_id}` : 'Sin configuración'}
          </Card.Text>
          <Button variant="success">
            {garden.estado_riego === 'regando' ? 'Detener riego' : 'Iniciar riego'}
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}

export default DetallesJardin;