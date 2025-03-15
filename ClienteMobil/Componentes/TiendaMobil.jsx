import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Button } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TiendaMobil = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [categoria, setCategoria] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const url =
          categoria !== 'todas'
            ? `http://192.168.1.38:3000/tabla/Productos/filtrar?tipo_producto=${categoria}`
            : 'http://192.168.1.38:3000/tabla/Productos';

        const response = await axios.get(url);
        setProductos(response.data);
      } catch (error) {
        console.error('Error al obtener productos:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos');
      }
    };

    fetchProductos();
  }, [categoria]);

  const agregarAlCarrito = (producto) => {
    if (producto.stock > 0) {
      if (!carrito.some((item) => item.producto_id === producto.producto_id)) {
        setCarrito([...carrito, producto]);
        Alert.alert('Producto añadido', `${producto.nombre} se añadió al carrito`);
      } else {
        Alert.alert('Producto ya en el carrito', `${producto.nombre} ya está en el carrito`);
      }
    } else {
      Alert.alert('Producto agotado', `${producto.nombre} no tiene stock disponible`);
    }
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito(carrito.filter((item) => item.producto_id !== productoId));
    Alert.alert('Producto eliminado', 'El producto fue eliminado del carrito');
  };

  const realizarCompra = async () => {
    if (carrito.length === 0) {
      Alert.alert('Carrito vacío', 'No hay productos en el carrito para comprar');
      return;
    }

    try {
      setIsLoading(true);

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Debe iniciar sesión para realizar una compra');
        return;
      }

      const productosFormateados = carrito.map((item) => ({
        producto_id: item.producto_id,
        nombre: item.nombre,
        descripcion: item.descripcion || item.nombre,
        precio: parseFloat(item.precio),
        stock: item.stock,
      }));

      const response = await axios.post('http://192.168.1.38:3000/comprar', {
        userId: parseInt(userId),
        productos: productosFormateados,
      });

      if (response.data.success) {
        Alert.alert('Compra exitosa', '¡Tu compra se realizó con éxito!');
        setCarrito([]);
        setShowModal(false);

        // Recargar productos para actualizar el stock
        const url =
          categoria !== 'todas'
            ? `http://192.168.1.38:3000/tabla/Productos/filtrar?tipo_producto=${categoria}`
            : 'http://192.168.1.38:3000/tabla/Productos';
        const productosActualizados = await axios.get(url);
        setProductos(productosActualizados.data);
      }
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      Alert.alert('Error', 'No se pudo realizar la compra');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProducto = ({ item }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.nombre}</Text>
      <Text style={styles.productDescription}>{item.descripcion}</Text>
      <Text style={styles.productPrice}>${item.precio}</Text>
      <Text style={styles.productStock}>
        {item.stock > 0 ? `${item.stock} disponibles` : 'Agotado'}
      </Text>
      <TouchableOpacity
        style={[styles.addButton, item.stock === 0 && styles.disabledButton]}
        onPress={() => agregarAlCarrito(item)}
        disabled={item.stock === 0}
      >
        <Text style={styles.addButtonText}>
          {item.stock > 0 ? 'Añadir al carrito' : 'Sin stock'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tienda Verde</Text>

      {/* Selector de categoría */}
      <View style={styles.categorySelector}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            categoria === 'todas' && styles.activeCategoryButton,
          ]}
          onPress={() => setCategoria('todas')}
        >
          <Text style={styles.categoryButtonText}>Todas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            categoria === 'planta' && styles.activeCategoryButton,
          ]}
          onPress={() => setCategoria('planta')}
        >
          <Text style={styles.categoryButtonText}>Plantas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            categoria === 'articulo' && styles.activeCategoryButton,
          ]}
          onPress={() => setCategoria('articulo')}
        >
          <Text style={styles.categoryButtonText}>Artículos</Text>
        </TouchableOpacity>
      </View>

      {/* Listado de productos */}
      <FlatList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.producto_id.toString()}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay productos disponibles</Text>
        }
      />

      {/* Botón para abrir el carrito */}
      <TouchableOpacity style={styles.cartButton} onPress={() => setShowModal(true)}>
        <Text style={styles.cartButtonText}>Carrito ({carrito.length})</Text>
      </TouchableOpacity>

      {/* Modal del carrito */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Carrito</Text>
          {carrito.length === 0 ? (
            <Text style={styles.emptyText}>El carrito está vacío</Text>
          ) : (
            carrito.map((item) => (
              <View key={item.producto_id} style={styles.cartItem}>
                <Text style={styles.cartItemText}>{item.nombre}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => quitarDelCarrito(item.producto_id)}
                >
                  <Text style={styles.removeButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={styles.cartFooter}>
            <Text style={styles.totalText}>
              Total: $
              {carrito.reduce((sum, item) => sum + parseFloat(item.precio), 0).toFixed(2)}
            </Text>
            <Button
              title={isLoading ? 'Procesando...' : 'Finalizar Compra'}
              onPress={realizarCompra}
              disabled={carrito.length === 0 || isLoading}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f6fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#dcdde1',
  },
  activeCategoryButton: {
    backgroundColor: '#27ae60',
  },
  categoryButtonText: {
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  productList: {
    paddingBottom: 80,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  productDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginVertical: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  productStock: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cartButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 50,
    elevation: 4,
  },
  cartButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f6fa',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
  },
  cartItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cartFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    marginTop: 16,
  },
});

export default TiendaMobil;