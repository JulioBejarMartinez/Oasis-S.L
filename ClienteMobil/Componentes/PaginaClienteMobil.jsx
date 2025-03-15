import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TextInput, Button, Alert, TouchableOpacity, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PaginaClienteMobil = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({ nombre: '', email: '' });
  const [updating, setUpdating] = useState(false);

  // Obtener datos del usuario y sensores
  const fetchData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      // Obtener datos del usuario y sus jardines
      const userResponse = await axios.get(`http://192.168.1.38:3000/usuario/${userId}`);
      setUserData(userResponse.data.user);
      setGardens(userResponse.data.gardens);

      // Inicializar el formulario con los datos actuales
      setEditFormData({
        nombre: userResponse.data.user.nombre,
        email: userResponse.data.user.email,
      });

      // Obtener datos de sensores en tiempo real
      const sensorResponse = await axios.get('http://192.168.1.38:3000/sensores/tiempoReal');
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

  // Manejar cambios en el formulario de edición
  const handleInputChange = (name, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Enviar datos actualizados al servidor
  const handleSubmit = async () => {
    setUpdating(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.put(`http://192.168.1.38:3000/usuario/${userId}`, editFormData);
      if (response.data.success) {
        setUserData((prev) => ({
          ...prev,
          ...editFormData,
        }));
        Alert.alert('Éxito', 'Datos actualizados correctamente');
        setEditModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar los datos');
      console.error('Error updating user data:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#2ecc71']}
          tintColor="#2ecc71"
        />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Bienvenido, {userData?.nombre}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.iconButton, styles.editButton]}
            onPress={() => setEditModalVisible(true)}
          >
            <MaterialCommunityIcons name="account-edit" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.storeButton]}
            onPress={() => navigation.navigate('TiendaMobil')}
          >
            <MaterialCommunityIcons name="store" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjeta de Estado General Mejorada */}
      <View style={styles.statusCard}>
        <View style={styles.statusIconContainer}>
          <MaterialCommunityIcons name="leaf" size={32} color="white" />
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>Estado del Sistema</Text>
          <Text style={styles.statusSubtitle}>Todo funciona correctamente</Text>
        </View>
      </View>

      {/* Sensores Mejorados */}
      <Text style={styles.sectionTitle}>Monitorización en Tiempo Real</Text>
      <View style={styles.sensorsGrid}>
        {[
          { key: 'tempC', icon: 'thermometer', label: 'Temperatura', unit: '°C', color: '#e74c3c' },
          { key: 'humedadAire', icon: 'water-percent', label: 'Humedad Aire', unit: '%', color: '#3498db' },
          { key: 'humedadSuelo', icon: 'flower', label: 'Humedad Suelo', unit: '%', color: '#27ae60' },
          { key: 'nivelAgua', icon: 'water', label: 'Nivel de Agua', unit: '%', color: '#2980b9' },
        ].map((sensor, index) => (
          <View 
            key={sensor.key}
            style={[
              styles.sensorCard, 
              { 
                borderLeftWidth: 6, 
                borderLeftColor: sensor.color,
                width: '48%', // Ancho ajustado para 2 columnas
                aspectRatio: 1, // Mantener relación cuadrada
              }
            ]}
          >
            <MaterialCommunityIcons 
              name={sensor.icon} 
              size={32} 
              color={sensor.color} 
              style={styles.sensorIcon}
            />
            <Text style={styles.sensorValue}>
              {sensorData?.[sensor.key]?.toFixed(1) || '--'}{sensor.unit}
            </Text>
            <Text style={styles.sensorLabel}>{sensor.label}</Text>
          </View>
        ))}
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
          {/* Botón para acceder a los detalles del jardín */}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate('DetallesJardinMobil', { id: garden.id })}
          >
            <Text style={styles.detailsButtonText}>Ver Detalles</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Modal para editar datos */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={editFormData.nombre}
              onChangeText={(text) => handleInputChange('nombre', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editFormData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setEditModalVisible(false)}
                color="#e74c3c"
              />
              <Button
                title={updating ? 'Guardando...' : 'Guardar'}
                onPress={handleSubmit}
                disabled={updating}
                color="#2ecc71"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#2ecc71',
  },
  storeButton: {
    backgroundColor: '#e67e22',
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#2ecc71',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  statusIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginVertical: 16,
    marginLeft: 8,
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
  },
  sensorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Ancho y altura se controlan con width y aspectRatio
  },
  sensorIcon: {
    marginBottom: 10,
  },
  sensorValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2c3e50',
    marginVertical: 8,
  },
  sensorLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  gardenCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
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
  detailsButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  detailsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default PaginaClienteMobil;