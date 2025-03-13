import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';


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
      const userResponse = await axios.get(`http://192.168.1.57:3000/usuario/${userId}`);
      setUserData(userResponse.data.user);
      setGardens(userResponse.data.gardens);

      // Obtener datos de sensores en tiempo real
      const sensorResponse = await axios.get('http://192.168.1.57:3000/sensores/tiempoReal');
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>Bienvenido, {userData?.nombre}</Text>
      
      {/* Tarjeta de Estado General */}
      <View style={styles.statusCard}>
        <MaterialCommunityIcons name="leaf" size={24} color="#2ecc71" />
        <Text style={styles.statusText}>Estado del Jardín: Normal</Text>
      </View>

      {/* Sección de Sensores */}
      <Text style={styles.sectionTitle}>Monitorización en Tiempo Real</Text>
      <View style={styles.sensorsGrid}>
        <View style={[styles.sensorCard, styles.temperatureCard]}>
          <MaterialCommunityIcons name="thermometer" size={32} color="#e74c3c" />
          <Text style={styles.sensorValue}>
            {sensorData?.tempC?.toFixed(1) || '--'}°C
          </Text>
          <Text style={styles.sensorLabel}>Temperatura</Text>
        </View>

        <View style={[styles.sensorCard, styles.humidityCard]}>
          <MaterialCommunityIcons name="water-percent" size={32} color="#3498db" />
          <Text style={styles.sensorValue}>
            {sensorData?.humedadAire?.toFixed(1) || '--'}%
          </Text>
          <Text style={styles.sensorLabel}>Humedad Aire</Text>
        </View>

        <View style={[styles.sensorCard, styles.soilCard]}>
          <MaterialCommunityIcons name="flower" size={32} color="#27ae60" />
          <Text style={styles.sensorValue}>
            {sensorData?.humedadSuelo?.toFixed(1) || '--'}%
          </Text>
          <Text style={styles.sensorLabel}>Humedad Suelo</Text>
        </View>

        <View style={[styles.sensorCard, styles.waterCard]}>
          <MaterialCommunityIcons name="water" size={32} color="#2980b9" />
          <Text style={styles.sensorValue}>
            {sensorData?.nivelAgua?.toFixed(1) || '--'}%
          </Text>
          <Text style={styles.sensorLabel}>Nivel de Agua</Text>
        </View>
      </View>

      {/* Sección de Jardines */}
      <Text style={styles.sectionTitle}>Tus Jardines</Text>
      {gardens.map((garden) => (
        <View key={garden.id} style={styles.gardenCard}>
          <View style={styles.gardenHeader}>
            <MaterialCommunityIcons name="sprout" size={20} color="#27ae60" />
            <Text style={styles.gardenTitle}>Jardín {garden.configuracion_id}</Text>
          </View>
          
          <View style={styles.gardenInfoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#7f8c8d" />
            <Text style={styles.gardenText}>{garden.ubicacion}</Text>
          </View>
          
          <View style={styles.gardenStatus}>
            <View style={[
              styles.statusIndicator,
              garden.estado_riego === 'regando' ? styles.activeStatus : styles.inactiveStatus
            ]}>
              <Text style={styles.statusText}>
                {garden.estado_riego === 'regando' ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f6fa',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginVertical: 16,
    marginLeft: 8,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  temperatureCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  humidityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  soilCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  waterCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
  },
  sensorValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginVertical: 8,
  },
  sensorLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  gardenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gardenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gardenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  gardenInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gardenText: {
    marginLeft: 8,
    color: '#7f8c8d',
  },
  gardenStatus: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeStatus: {
    backgroundColor: '#27ae60',
  },
  inactiveStatus: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PaginaClienteMobil;