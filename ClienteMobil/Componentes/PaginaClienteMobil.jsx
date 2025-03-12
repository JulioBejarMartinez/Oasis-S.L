import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaginaClienteMobil = () => {
  const [userData, setUserData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Obtener datos del usuario y sensores
  const fetchData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      // Obtener datos del usuario y sus jardines
      const userResponse = await axios.get(`http://192.168.1.53:3000/usuario/${userId}`);
      setUserData(userResponse.data.user);
      setGardens(userResponse.data.gardens);

      // Obtener datos de sensores en tiempo real
      const sensorResponse = await axios.get('http://192.168.1.53:3000/sensores/tiempoReal');
      setSensorData(sensorResponse.data);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Actualización periódica cada 30 segundos
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para actualizar manualmente
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Text style={styles.header}>Bienvenido, {userData?.nombre}</Text>
      
      {/* Sección de Sensores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos de Sensores</Text>
        {sensorData && (
          <>
            <Text>🌡️ Temperatura: {sensorData.tempC}°C</Text>
            <Text>💧 Humedad Suelo: {sensorData.humedadSuelo}%</Text>
            <Text>💦 Humedad Aire: {sensorData.humedadAire}%</Text>
            <Text>🚰 Nivel Agua: {sensorData.nivelAgua}</Text>
          </>
        )}
      </View>

      {/* Sección de Jardines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tus Jardines</Text>
        {gardens.map(garden => (
          <View key={garden.id} style={styles.gardenCard}>
            <Text>📍 Ubicación: {garden.ubicacion}</Text>
            <Text>⚙️ Configuración: {garden.configuracion_id}</Text>
            <Text>🔄 Estado: {garden.estado_riego}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  gardenCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
});

export default PaginaClienteMobil;