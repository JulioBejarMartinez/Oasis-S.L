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

    // Convert the result to a username-password-pair when the login button is clicked.
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
        // Call your API to add the user
        String response = apiClient.insertarRegistro("Usuarios", user.toMap());
        mostrarAlerta("Resultado", response);
    });
    }

    private void mostrarFormularioAgregarJardin(){

    }

    private void mostrarFormularioAgregarProducto(){

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