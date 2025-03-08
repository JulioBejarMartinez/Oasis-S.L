package com.example;

import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;

import org.json.JSONArray;
import org.json.JSONObject;

import com.example.APIConecction.ApiClient;

import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.scene.control.Alert;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonBar;
import javafx.scene.control.ButtonType;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.Pane;
import javafx.util.Callback;
import javafx.scene.control.TableColumn.CellDataFeatures;
import javafx.beans.value.ObservableValue;
import javafx.beans.property.SimpleStringProperty;

public class InterfazJardinController {

    @FXML
    private Pane rootPane;

    @FXML
    private Button usuariosButton;

    @FXML
    private Button jardinesButton;

    @FXML
    private Button productosButton;

    @FXML
    private Button facturasButton;

    @FXML
    private Button plantasButton;

    @FXML
    private Button configuracionesButton;

    @FXML
    private Button agregarButton;

    @FXML
    private Button editarButton;

    @FXML
    private TableView<JSONObject> tableView;

    private ApiClient apiClient;

    private boolean isLoading = false;

    // Variable para almacenar el nombre de la tabla actual
    private String tablaActual;

    @FXML
    public void initialize() {
        apiClient = new ApiClient();
        usuariosButton.setOnAction(event -> cargarTabla("Usuarios"));
        jardinesButton.setOnAction(event -> cargarTabla("Jardines"));
        productosButton.setOnAction(event -> cargarTabla("Productos"));
        facturasButton.setOnAction(event -> cargarTabla("Facturas"));
        plantasButton.setOnAction(event -> cargarTabla("Plantas"));
        configuracionesButton.setOnAction(event -> cargarTabla("Configuraciones"));
        agregarButton.setOnAction(event -> mostrarFormularioAgregar("agregar", null));
        editarButton.setOnAction(event -> {
            JSONObject selectedItem = tableView.getSelectionModel().getSelectedItem();
            if (selectedItem != null) {
                mostrarFormularioAgregar("editar", selectedItem);
            } else {
                mostrarAlerta("Error", "No se ha seleccionado ningún registro para editar.");
            }
        });

        // Apply styles to the TableView
        tableView.setStyle("-fx-background-color: #FFD69E; -fx-border-color: #EDA052;");
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
    }

    // Funcion encargada de cargar cada una de las tablas de la BBDD
    // Cada uno de los botones de la interfaz llama a esta funcion con el nombre de la tabla
    // La tabla se carga con los registros de la tabla de la BBDD

    private void cargarTabla(String nombreTabla) {

        // Aqui se consigue el nombre de la tabla actual
        this.tablaActual = nombreTabla;

        if (isLoading) {
            return; // Prevent multiple simultaneous loads
        }
        isLoading = true;

        String response = apiClient.getRegistros(nombreTabla);

        if (response == null || response.isEmpty()) {
            mostrarAlerta("Error", "No se pudieron cargar los registros.");
            isLoading = false;
            return;
        }

        JSONArray jsonArray = new JSONArray(response);
        if (jsonArray.length() == 0) {
            mostrarAlerta("Información", "No hay registros en la tabla.");
            isLoading = false;
            return;
        }

        tableView.getColumns().clear();
        tableView.getItems().clear();

        JSONObject firstObject = jsonArray.getJSONObject(0);
        Iterator<String> keys = firstObject.keys();

        while (keys.hasNext()) {
            String key = keys.next();
            TableColumn<JSONObject, String> column = new TableColumn<>(key);
            column.setCellValueFactory(new Callback<CellDataFeatures<JSONObject, String>, ObservableValue<String>>() {
                @Override
                public ObservableValue<String> call(CellDataFeatures<JSONObject, String> param) {
                    return new SimpleStringProperty(param.getValue().optString(key));
                }
            });
            column.setStyle("-fx-background-color: #FFD69E; -fx-border-color: #EDA052;");
            tableView.getColumns().add(column);
        }

        // Set proportional resizing for columns
        for (TableColumn<JSONObject, ?> column : tableView.getColumns()) {
            column.prefWidthProperty().bind(tableView.widthProperty().divide(tableView.getColumns().size()));
        }

        for (int i = 0; i < jsonArray.length(); i++) {
            tableView.getItems().add(jsonArray.getJSONObject(i));
        }

        isLoading = false;
    }


    // Funcion encargada de mostrar el formulario para agregar un registro a la tabla actual
    // Se comprueba el nombre de la tabla actual y se llama a la funcion correspondiente

    private void mostrarFormularioAgregar(String tipoFormulario, JSONObject registroExistente) {
        // Comprueba si se ha seleccionado una tabla
            if(tablaActual == null){
                mostrarAlerta("Error", "No se ha seleccionado ninguna tabla.");
                return;
            }
            switch(tablaActual.toLowerCase()){
                case "usuarios":
                    mostrarFormularioAgregarUsuario(tipoFormulario, registroExistente);
                    break;
                case "jardines":
                    mostrarFormularioAgregarJardin(tipoFormulario, registroExistente);
                    break;
                case "productos":
                    mostrarFormularioAgregarProducto(tipoFormulario, registroExistente);
                    break;
                case "facturas":
                    mostrarFormularioAgregarFactura();
                    break;
                case "plantas":
                    mostrarFormularioAgregarPlanta();
                    break;
                case "configuraciones":
                    mostrarFormularioAgregarConfiguracion();
                    break;
                default:
                    mostrarAlerta("Error", "No se ha seleccionado ninguna tabla.");
                    break;
            }
    }

    //
    //
    // Funciones para mostrar los formularios de agregar un registro a cada una de las tablas
    // Cada una de estas funciones muestra un formulario con los campos necesarios para agregar un registro
    // Se recogen los datos introducidos por el usuario y se envian a la API para insertar el registro
    //
    //


    //Funcion para mostrar el formulario de agregar un usuario
    //Se muestra un dialogo con los campos necesarios para agregar un usuario
    //Se recogen los datos introducidos por el usuario y se envian a la API para insertar el registro
    private void mostrarFormularioAgregarUsuario(String tipoFormulario, JSONObject registroExistente) {
        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle(tipoFormulario.equals("agregar") ? "Agregar Usuario" : "Editar Usuario");

        // Se crean los botones
        ButtonType actionButtonType = new ButtonType(tipoFormulario.equals("agregar") ? "Agregar" : "Guardar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(actionButtonType, ButtonType.CANCEL);

        // Se crean los campos que el usuario debe rellenar
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));

        TextField nombre = new TextField();
        nombre.setPromptText("Nombre");
        TextField email = new TextField();
        email.setPromptText("Email");
        PasswordField password = new PasswordField();
        password.setPromptText("Contraseña");
        ComboBox<String> rol = new ComboBox<>();
        rol.getItems().addAll("cliente", "admin");
        rol.setPromptText("Rol");

        if (registroExistente != null) {
            nombre.setText(registroExistente.optString("nombre"));
            email.setText(registroExistente.optString("email"));
            password.setText(registroExistente.optString("contraseña_hash"));
            rol.setValue(registroExistente.optString("rol"));
        }

        grid.add(new Label("Nombre:"), 0, 0);
        grid.add(nombre, 1, 0);
        grid.add(new Label("Email:"), 0, 1);
        grid.add(email, 1, 1);
        grid.add(new Label("Contraseña:"), 0, 2);
        grid.add(password, 1, 2);
        grid.add(new Label("Rol:"), 0, 3);
        grid.add(rol, 1, 3);

        dialog.getDialogPane().setContent(grid);

        // Convierte el resultado a un JSONObject cuando se hace clic en el botón Agregar o Guardar.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == actionButtonType) {
                JSONObject newUser = new JSONObject();
                newUser.put("nombre", nombre.getText());
                newUser.put("email", email.getText());
                newUser.put("contraseña_hash", password.getText());
                newUser.put("rol", rol.getValue());
                newUser.put("fecha_registro", LocalDateTime.now().toString());
                return newUser;
            }
            return null;
        });

        Optional<JSONObject> result = dialog.showAndWait();

        result.ifPresent(user -> {
            if (tipoFormulario.equals("agregar")) {
                // LLamo a la Api para hacer la inserción del usuario
                String response = apiClient.insertarRegistro("Usuarios", user.toMap());
                mostrarAlerta("Resultado", response);
            } else {
                // LLamo a la Api para hacer la actualización del usuario
                String response = apiClient.actualizarRegistro("Usuarios", "usuario_id", String.valueOf(registroExistente.getInt("usuario_id")), user.toMap());
                mostrarAlerta("Resultado", response);
            }
        });

        cargarTabla(tablaActual);
    }


    //Funcion para mostrar el formulario de agregar un jardin
    //Se muestra un dialogo con los campos necesarios para agregar un jardin
    //Se recogen los datos introducidos por el usuario y se envian a la API para insertar el registro
    private void mostrarFormularioAgregarJardin(String tipoFormulario, JSONObject registroExistente) {
        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle(tipoFormulario.equals("agregar") ? "Agregar Jardín" : "Editar Jardín");
    
        // Set the button types
        ButtonType actionButtonType = new ButtonType(tipoFormulario.equals("agregar") ? "Agregar" : "Guardar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(actionButtonType, ButtonType.CANCEL);
    
        // Create the labels and fields
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));
    
        TextField ubicacion = new TextField();
        ubicacion.setPromptText("Ubicación");
    
        ComboBox<Integer> usuarioIdComboBox = new ComboBox<>();
        usuarioIdComboBox.setPromptText("Usuario ID");
    
        ComboBox<Integer> configuracionIdComboBox = new ComboBox<>();
        configuracionIdComboBox.setPromptText("Configuración ID");
    
        // Fetch user IDs from the API and populate the ComboBox
        String responseUsuarios = apiClient.getRegistros("Usuarios");
        JSONArray usuarios = new JSONArray(responseUsuarios);
        for (int i = 0; i < usuarios.length(); i++) {
            JSONObject usuario = usuarios.getJSONObject(i);
            usuarioIdComboBox.getItems().add(usuario.getInt("usuario_id"));
        }
    
        // Fetch configuration IDs from the API and populate the ComboBox
        String responseConfiguraciones = apiClient.getRegistros("Configuraciones");
        JSONArray configuraciones = new JSONArray(responseConfiguraciones);
        for (int i = 0; i < configuraciones.length(); i++) {
            JSONObject configuracion = configuraciones.getJSONObject(i);
            configuracionIdComboBox.getItems().add(configuracion.getInt("configuracion_id"));
        }
    
        if (registroExistente != null) {
            ubicacion.setText(registroExistente.optString("ubicacion"));
            usuarioIdComboBox.setValue(registroExistente.optInt("usuario_id"));
            configuracionIdComboBox.setValue(registroExistente.optInt("configuracion_id"));
        }
    
        grid.add(new Label("Ubicación:"), 0, 0);
        grid.add(ubicacion, 1, 0);
        grid.add(new Label("Usuario ID:"), 0, 1);
        grid.add(usuarioIdComboBox, 1, 1);
        grid.add(new Label("Configuración ID:"), 0, 2);
        grid.add(configuracionIdComboBox, 1, 2);
    
        dialog.getDialogPane().setContent(grid);
    
        // Convert the result to a JSONObject when the add button is clicked.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == actionButtonType) {
                JSONObject newJardin = new JSONObject();
                newJardin.put("ubicacion", ubicacion.getText());
                newJardin.put("usuario_id", usuarioIdComboBox.getValue());
                newJardin.put("configuracion_id", configuracionIdComboBox.getValue());
                return newJardin;
            }
            return null;
        });
    
        Optional<JSONObject> result = dialog.showAndWait();
    
        result.ifPresent(jardin -> {
            if (tipoFormulario.equals("agregar")) {
                // Call your API to add the garden
                String responseInsert = apiClient.insertarRegistro("Jardines", jardin.toMap());
                mostrarAlerta("Resultado", responseInsert);
            } else {
                // Call your API to update the garden
                String responseUpdate = apiClient.actualizarRegistro("Jardines", "jardin_id", String.valueOf(registroExistente.getInt("jardin_id")), jardin.toMap());
                mostrarAlerta("Resultado", responseUpdate);
            }
        });
    
        cargarTabla(tablaActual);
    }


    //Funcion para mostrar el formulario de agregar un producto
    //Se muestra un dialogo con los campos necesarios para agregar un producto
    //Se recogen los datos introducidos por el usuario y se envian a la API para insertar el registro
    private void mostrarFormularioAgregarProducto(String tipoFormulario, JSONObject registroExistente) {
        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle(tipoFormulario.equals("agregar") ? "Agregar Producto" : "Editar Producto");
    
        // Set the button types
        ButtonType actionButtonType = new ButtonType(tipoFormulario.equals("agregar") ? "Agregar" : "Guardar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(actionButtonType, ButtonType.CANCEL);
    
        // Create the labels and fields
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));
    
        TextField nombre = new TextField();
        nombre.setPromptText("Nombre");
    
        TextField descripcion = new TextField();
        descripcion.setPromptText("Descripción");
    
        TextField precio = new TextField();
        precio.setPromptText("Precio");
    
        TextField stock = new TextField();
        stock.setPromptText("Stock");
    
        ComboBox<String> tipoProductoComboBox = new ComboBox<>();
        tipoProductoComboBox.getItems().addAll("articulo", "planta");
        tipoProductoComboBox.setPromptText("Tipo de Producto");
    
        if (registroExistente != null) {
            nombre.setText(registroExistente.optString("nombre"));
            descripcion.setText(registroExistente.optString("descripcion"));
            precio.setText(String.valueOf(registroExistente.optDouble("precio")));
            stock.setText(String.valueOf(registroExistente.optInt("stock")));
            tipoProductoComboBox.setValue(registroExistente.optString("tipo_producto"));
        }
    
        grid.add(new Label("Nombre:"), 0, 0);
        grid.add(nombre, 1, 0);
        grid.add(new Label("Descripción:"), 0, 1);
        grid.add(descripcion, 1, 1);
        grid.add(new Label("Precio:"), 0, 2);
        grid.add(precio, 1, 2);
        grid.add(new Label("Stock:"), 0, 3);
        grid.add(stock, 1, 3);
        grid.add(new Label("Tipo de Producto:"), 0, 4);
        grid.add(tipoProductoComboBox, 1, 4);
    
        dialog.getDialogPane().setContent(grid);
    
        // Convert the result to a JSONObject when the add button is clicked.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == actionButtonType) {
                JSONObject newProducto = new JSONObject();
                newProducto.put("nombre", nombre.getText());
                newProducto.put("descripcion", descripcion.getText());
                newProducto.put("precio", Double.parseDouble(precio.getText()));
                newProducto.put("stock", Integer.parseInt(stock.getText()));
                newProducto.put("tipo_producto", tipoProductoComboBox.getValue());
                return newProducto;
            }
            return null;
        });
    
        Optional<JSONObject> result = dialog.showAndWait();
    
        result.ifPresent(producto -> {
            if (tipoFormulario.equals("agregar")) {
                // Call your API to add the product
                String responseInsert = apiClient.insertarRegistro("Productos", producto.toMap());
                mostrarAlerta("Resultado", responseInsert);
            } else {
                // Call your API to update the product
                String responseUpdate = apiClient.actualizarRegistro("Productos", "producto_id", String.valueOf(registroExistente.getInt("producto_id")), producto.toMap());
                mostrarAlerta("Resultado", responseUpdate);
            }
        });
    
        cargarTabla(tablaActual);
    }

    private void mostrarFormularioAgregarPlanta() {
        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle("Agregar Planta");
    
        // Set the button types
        ButtonType addButtonType = new ButtonType("Agregar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(addButtonType, ButtonType.CANCEL);
    
        // Create the labels and fields
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));
    
        ComboBox<Integer> productoIdComboBox = new ComboBox<>();
        productoIdComboBox.setPromptText("Producto ID");
    
        ComboBox<String> estadoComboBox = new ComboBox<>();
        estadoComboBox.getItems().addAll("Viva", "Muerta");
        estadoComboBox.setPromptText("Estado");
    
        // Fetch product IDs from the API and populate the ComboBox with only "planta" type products
        String responseProductos = apiClient.getRegistros("Productos");
        JSONArray productos = new JSONArray(responseProductos);
        for (int i = 0; i < productos.length(); i++) {
            JSONObject producto = productos.getJSONObject(i);
            if ("planta".equals(producto.getString("tipo_producto"))) {
                productoIdComboBox.getItems().add(producto.getInt("producto_id"));
            }
        }
    
        grid.add(new Label("Producto ID:"), 0, 0);
        grid.add(productoIdComboBox, 1, 0);
        grid.add(new Label("Estado:"), 0, 1);
        grid.add(estadoComboBox, 1, 1);
    
        dialog.getDialogPane().setContent(grid);
    
        // Convert the result to a JSONObject when the add button is clicked.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == addButtonType) {
                JSONObject newPlanta = new JSONObject();
                newPlanta.put("producto_id", productoIdComboBox.getValue());
                newPlanta.put("estado", estadoComboBox.getValue());
                return newPlanta;
            }
            return null;
        });
    
        Optional<JSONObject> result = dialog.showAndWait();
    
        result.ifPresent(planta -> {
            // Call your API to add the plant
            String responseInsert = apiClient.insertarRegistro("Plantas", planta.toMap());
            mostrarAlerta("Resultado", responseInsert);
        });
    
        cargarTabla(tablaActual);
    }

    private void mostrarFormularioAgregarFactura() {
        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle("Agregar Factura");
    
        // Set the button types
        ButtonType addButtonType = new ButtonType("Agregar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(addButtonType, ButtonType.CANCEL);
    
        // Create the labels and fields
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));
    
        TextField montoTotal = new TextField();
        montoTotal.setPromptText("Monto Total");
    
        ComboBox<String> estadoComboBox = new ComboBox<>();
        estadoComboBox.getItems().addAll("pendiente", "pagada", "cancelada");
        estadoComboBox.setPromptText("Estado");
    
        ComboBox<Integer> usuarioIdComboBox = new ComboBox<>();
        usuarioIdComboBox.setPromptText("Usuario ID");
    
        // Fetch user IDs from the API and populate the ComboBox
        String responseUsuarios = apiClient.getRegistros("Usuarios");
        JSONArray usuarios = new JSONArray(responseUsuarios);
        for (int i = 0; i < usuarios.length(); i++) {
            JSONObject usuario = usuarios.getJSONObject(i);
            usuarioIdComboBox.getItems().add(usuario.getInt("usuario_id"));
        }
    
        grid.add(new Label("Monto Total:"), 0, 0);
        grid.add(montoTotal, 1, 0);
        grid.add(new Label("Estado:"), 0, 1);
        grid.add(estadoComboBox, 1, 1);
        grid.add(new Label("Usuario ID:"), 0, 2);
        grid.add(usuarioIdComboBox, 1, 2);
    
        dialog.getDialogPane().setContent(grid);
    
        // Convert the result to a JSONObject when the add button is clicked.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == addButtonType) {
                JSONObject newFactura = new JSONObject();
                newFactura.put("fecha_emision", LocalDateTime.now().toString());
                newFactura.put("monto_total", Double.parseDouble(montoTotal.getText()));
                newFactura.put("estado", estadoComboBox.getValue());
                newFactura.put("usuario_id", usuarioIdComboBox.getValue());
                return newFactura;
            }
            return null;
        });
    
        Optional<JSONObject> result = dialog.showAndWait();
    
        result.ifPresent(factura -> {
            // Call your API to add the invoice
            String responseInsert = apiClient.insertarRegistro("Facturas", factura.toMap());
            mostrarAlerta("Resultado", responseInsert);
        });
    
        cargarTabla(tablaActual);
    }

    
    private void mostrarFormularioAgregarConfiguracion() {
        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle("Agregar Configuración");
    
        // Set the button types
        ButtonType addButtonType = new ButtonType("Agregar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(addButtonType, ButtonType.CANCEL);
    
        // Create the labels and fields
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));
    
        TextField tempMin = new TextField();
        tempMin.setPromptText("Temperatura Mínima");
        TextField tempMax = new TextField();
        tempMax.setPromptText("Temperatura Máxima");
        TextField humedadAmbMin = new TextField();
        humedadAmbMin.setPromptText("Humedad Ambiente Mínima");
        TextField humedadAmbMax = new TextField();
        humedadAmbMax.setPromptText("Humedad Ambiente Máxima");
        TextField humedadSueloMin = new TextField();
        humedadSueloMin.setPromptText("Humedad Suelo Mínima");
        TextField humedadSueloMax = new TextField();
        humedadSueloMax.setPromptText("Humedad Suelo Máxima");
        TextField nivelAguaMin = new TextField();
        nivelAguaMin.setPromptText("Nivel Agua Mínimo");
    
        grid.add(new Label("Temperatura Mínima:"), 0, 0);
        grid.add(tempMin, 1, 0);
        grid.add(new Label("Temperatura Máxima:"), 0, 1);
        grid.add(tempMax, 1, 1);
        grid.add(new Label("Humedad Ambiente Mínima:"), 0, 2);
        grid.add(humedadAmbMin, 1, 2);
        grid.add(new Label("Humedad Ambiente Máxima:"), 0, 3);
        grid.add(humedadAmbMax, 1, 3);
        grid.add(new Label("Humedad Suelo Mínima:"), 0, 4);
        grid.add(humedadSueloMin, 1, 4);
        grid.add(new Label("Humedad Suelo Máxima:"), 0, 5);
        grid.add(humedadSueloMax, 1, 5);
        grid.add(new Label("Nivel Agua Mínimo:"), 0, 6);
        grid.add(nivelAguaMin, 1, 6);
    
        dialog.getDialogPane().setContent(grid);
    
        // Convert the result to a JSONObject when the add button is clicked.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == addButtonType) {
                JSONObject newConfiguracion = new JSONObject();
                newConfiguracion.put("temp_min", tempMin.getText());
                newConfiguracion.put("temp_max", tempMax.getText());
                newConfiguracion.put("humedad_amb_min", humedadAmbMin.getText());
                newConfiguracion.put("humedad_amb_max", humedadAmbMax.getText());
                newConfiguracion.put("humedad_suelo_min", humedadSueloMin.getText());
                newConfiguracion.put("humedad_suelo_max", humedadSueloMax.getText());
                newConfiguracion.put("nivel_agua_min", nivelAguaMin.getText());
                return newConfiguracion;
            }
            return null;
        });
    
        Optional<JSONObject> result = dialog.showAndWait();
    
        result.ifPresent(configuracion -> {
            // Call your API to add the configuration
            String responseInsert = apiClient.insertarRegistro("Configuraciones", configuracion.toMap());
            mostrarAlerta("Resultado", responseInsert);
        });
    
        cargarTabla(tablaActual);
    }

    // Funcion encargada de mostrar una alerta en la interfaz
    // Recibe un titulo y un mensaje que se mostraran en la alerta
    // La alerta se muestra y espera a que el usuario la cierre
    private void mostrarAlerta(String titulo, String mensaje) {
        Alert alert = new Alert(AlertType.INFORMATION);
        alert.setTitle(titulo);
        alert.setHeaderText(null);
        alert.setContentText(mensaje);
        alert.showAndWait();
    }
}