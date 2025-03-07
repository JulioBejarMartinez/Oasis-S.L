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
        agregarButton.setOnAction(event -> mostrarFormularioAgregar());
        
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

    private void mostrarFormularioAgregar() {
        // Comprueba si se ha seleccionado una tabla
            if(tablaActual == null){
                mostrarAlerta("Error", "No se ha seleccionado ninguna tabla.");
                return;
            }
            switch(tablaActual.toLowerCase()){
                case "usuarios":
                    mostrarFormularioAgregarUsuario();
                    break;
                case "jardines":
                    mostrarFormularioAgregarJardin();
                    break;
                case "productos":
                    mostrarFormularioAgregarProducto();
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
    private void mostrarFormularioAgregarUsuario(){

        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle("Agregar Usuario");

        // Set the button types
        ButtonType addButtonType = new ButtonType("Agregar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(addButtonType, ButtonType.CANCEL);

        // Create the username and email labels and fields
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

        grid.add(new Label("Nombre:"), 0, 0);
        grid.add(nombre, 1, 0);
        grid.add(new Label("Email:"), 0, 1);
        grid.add(email, 1, 1);
        grid.add(new Label("Contraseña:"), 0, 2);
        grid.add(password, 1, 2);
        grid.add(new Label("Rol:"), 0, 3);
        grid.add(rol, 1, 3);

        dialog.getDialogPane().setContent(grid);

        // Convierte el resultado a un JSONObject cuando se hace clic en el botón Agregar.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == addButtonType) {
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
        // LLamo a la Api para hacer la inserción del usuario
        String response = apiClient.insertarRegistro("Usuarios", user.toMap());
        mostrarAlerta("Resultado", response);
    });

    cargarTabla(tablaActual);
    }


    //Funcion para mostrar el formulario de agregar un jardin
    //Se muestra un dialogo con los campos necesarios para agregar un jardin
    //Se recogen los datos introducidos por el usuario y se envian a la API para insertar el registro
    private void mostrarFormularioAgregarJardin(){

        Dialog<JSONObject> dialog = new Dialog<>();
        dialog.setTitle("Agregar Jardín");

        // Set the button types
        ButtonType addButtonType = new ButtonType("Agregar", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(addButtonType, ButtonType.CANCEL);

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

        grid.add(new Label("Ubicación:"), 0, 0);
        grid.add(ubicacion, 1, 0);
        grid.add(new Label("Usuario ID:"), 0, 1);
        grid.add(usuarioIdComboBox, 1, 1);
        grid.add(new Label("Configuración ID:"), 0, 2);
        grid.add(configuracionIdComboBox, 1, 2);

        dialog.getDialogPane().setContent(grid);

        // Convert the result to a JSONObject when the add button is clicked.
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == addButtonType) {
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
            // Call your API to add the garden
            String responseInsert = apiClient.insertarRegistro("Jardines", jardin.toMap());
            mostrarAlerta("Resultado", responseInsert);
    });

    cargarTabla(tablaActual);
    }


    //Funcion para mostrar el formulario de agregar un producto
    //Se muestra un dialogo con los campos necesarios para agregar un producto
    //Se recogen los datos introducidos por el usuario y se envian a la API para insertar el registro
    private void mostrarFormularioAgregarProducto(){
        Dialog<JSONObject> dialog = new Dialog<>();
    dialog.setTitle("Agregar Producto");

    // Set the button types
    ButtonType addButtonType = new ButtonType("Agregar", ButtonBar.ButtonData.OK_DONE);
    dialog.getDialogPane().getButtonTypes().addAll(addButtonType, ButtonType.CANCEL);

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
        if (dialogButton == addButtonType) {
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
        // Call your API to add the product
        String responseInsert = apiClient.insertarRegistro("Productos", producto.toMap());
        mostrarAlerta("Resultado", responseInsert);
    });

    cargarTabla(tablaActual);
    }

    private void mostrarFormularioAgregarFactura(){

    }

    private void mostrarFormularioAgregarPlanta(){

    }

    private void mostrarFormularioAgregarConfiguracion(){

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