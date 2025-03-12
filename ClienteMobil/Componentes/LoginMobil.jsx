import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const LoginMobil = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/login', {
        email,
        password,
      });

      // Store user ID in local storage or AsyncStorage
      // For example: await AsyncStorage.setItem('userId', response.data.usuario_id);

      switch (response.data.rol) {
        case 'cliente':
          navigation.navigate('PaginaCliente');
          break;
        case 'admin':
          navigation.navigate('PaginaCliente');
          break;
        default:
          Alert.alert('Error', 'Rol de usuario no reconocido');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error de conexión';
      Alert.alert('Error', `Error: ${errorMessage}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso al Sistema</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        required
      />
      <Button title="Ingresar" onPress={handleSubmit} />
      <Text style={styles.registerText}>
        ¿No tienes cuenta? <Text style={styles.registerLink}>Regístrate</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  registerText: {
    textAlign: 'center',
    marginTop: 20,
  },
  registerLink: {
    color: 'blue',
  },
});

export default LoginMobil;