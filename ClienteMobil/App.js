import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginMobil from './Componentes/LoginMobil';
import PaginaClienteMobil from './Componentes/PaginaClienteMobil';
import TiendaMobil from './Componentes/TiendaMobil';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginMobil} />
        <Stack.Screen 
          name="PaginaClienteMobil" 
          component={PaginaClienteMobil}
          options={{ title: 'Mi Jardín' }}
        />
        <Stack.Screen
          name="TiendaMobil"
          component={TiendaMobil}
          options={{ title: 'Tienda' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
