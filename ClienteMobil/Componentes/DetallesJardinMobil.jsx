import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DetallesJardinMobil = ({ route, navigation }) => {
  const { id } = route.params; // Recibe el ID del jardín desde la navegación
  const [garden, setGarden] = useState(null);
  const [configuracion, setConfiguracion] = useState(null);
  const [productos, setProductos] = useState([]); // Estado para los productos del jardín
  const [formData, setFormData] = useState({});
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error('Usuario no autenticado');
  
        const [gardenRes, configRes] = await Promise.all([
          axios.get(`http://192.168.1.38:3000/jardin/${id}?userId=${userId}`),
          axios.get(`http://192.168.1.38:3000/jardin/${id}/configuracion`)
        ]);
        //console.log('Garden Data:', gardenRes.data);
  
        setGarden(gardenRes.data);
        setConfiguracion(configRes.data);
        setFormData(configRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos del jardín');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [id]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://192.168.1.38:3000/jardin/${id}/configuracion`, formData);
      setConfiguracion(formData);
      setEditando(false);
      setSuccess('Configuración actualizada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      Alert.alert('Error', 'Error al guardar la configuración');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Cargando detalles del jardín...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{garden.ubicacion}</Text>
      </View>

      {/* Estado de Riego */}
      <View style={[styles.card, styles.shadow]}>
        <View style={styles.cardHeader}>
          <Icon name="opacity" size={20} color="#2A9D8F" />
          <Text style={styles.cardTitle}>Estado de Riego</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            garden.estado_riego === 'regando' ? styles.activeIndicator : styles.inactiveIndicator
          ]}/>
          <Text style={styles.statusText}>
            {garden.estado_riego === 'regando' ? 'Regando Activamente' : 'Riego en Espera'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            garden.estado_riego === 'regando' ? styles.stopButton : styles.startButton,
          ]}
        >
          <Icon 
            name={garden.estado_riego === 'regando' ? 'stop-circle' : 'play-circle-filled'} 
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.actionButtonText}>
            {garden.estado_riego === 'regando' ? 'Detener Riego' : 'Iniciar Riego'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Configuración Actual */}
      <View style={[styles.card, styles.shadow]}>
        <View style={styles.cardHeader}>
          <Icon name="tune" size={20} color="#2A9D8F" />
          <Text style={styles.cardTitle}>Configuración Actual</Text>
          {!editando && (
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => setEditando(true)}
            >
              <Icon name="edit" size={20} color="#264653" />
            </TouchableOpacity>
          )}
        </View>

        {success ? (
          <View style={styles.successBanner}>
            <Icon name="check-circle" size={18} color="#FFF" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {editando ? (
          <>
            {['temp_min', 'temp_max', 'humedad_amb_min', 'humedad_amb_max', 
              'humedad_suelo_min', 'humedad_suelo_max', 'nivel_agua_min'].map((field) => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {field.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder={`Ingrese ${field.replace(/_/g, ' ')}`}
                  placeholderTextColor="#999"
                  value={formData[field]?.toString() || ''}
                  onChangeText={(value) => handleInputChange(field, value)}
                />
              </View>
            ))}
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setEditando(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.configGrid}>
            {Object.entries(configuracion || {}).map(([key, value]) => (
              <View key={key} style={styles.configItem}>
                <Text style={styles.configLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.configValue}>
                  {value}
                  {key.includes('temp') ? '°C' : key.includes('humedad') ? '%' : 'L'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Productos del Jardín */}
      <View style={[styles.card, styles.shadow]}>
        <View style={styles.cardHeader}>
          <Icon name="local-florist" size={20} color="#2A9D8F" />
          <Text style={styles.cardTitle}>Productos Asociados</Text>
        </View>
        {garden.productosComprados && garden.productosComprados.length > 0 ? (
          <FlatList
            data={garden.productosComprados}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.nombre}</Text>
                  <Text style={styles.productDescription}>{item.descripcion}</Text>
                </View>
                <Text style={styles.productPrice}>${item.precio}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="error-outline" size={30} color="#D8D8D8" />
            <Text style={styles.emptyText}>No hay productos asociados</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#2A9D8F',
    borderRadius: 12,
    padding: 16,
    marginTop: -8,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#264653',
    marginLeft: 8,
  },
  editIcon: {
    marginLeft: 'auto',
    padding: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  activeIndicator: {
    backgroundColor: '#2A9D8F',
  },
  inactiveIndicator: {
    backgroundColor: '#E9C46A',
  },
  statusText: {
    fontSize: 16,
    color: '#264653',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#2A9D8F',
  },
  stopButton: {
    backgroundColor: '#E76F51',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  configItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  configValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#264653',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#264653',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#CED4DA',
  },
  saveButton: {
    backgroundColor: '#2A9D8F',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#264653',
  },
  productDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A9D8F',
  },
  separator: {
    height: 1,
    backgroundColor: '#EDEDED',
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#ADB5BD',
    marginTop: 8,
    fontSize: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A9D8F',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 14,
  },
  // ... (mantener estilos de loading y error con mejoras similares)
});

export default DetallesJardinMobil;