package com.example;

import java.util.Iterator;

import org.json.JSONArray;
import org.json.JSONObject;

import com.example.APIConecction.ApiClient;

import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.control.Button;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
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
    private TableView<JSONObject> tableView;

    private ApiClient apiClient;

    @FXML
    public void initialize() {
        apiClient = new ApiClient();
        usuariosButton.setOnAction(event -> cargarUsuarios());
        
        // Apply styles to the TableView
        tableView.setStyle("-fx-background-color: #FFD69E; -fx-border-color: #EDA052;");
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
    }

    private void cargarUsuarios() {
        String nombreTabla = "Usuarios";
        String response = apiClient.getRegistros(nombreTabla);

        if (response == null || response.isEmpty()) {
            mostrarAlerta("Error", "No se pudieron cargar los registros.");
            return;
        }

        JSONArray jsonArray = new JSONArray(response);
        if (jsonArray.length() == 0) {
            mostrarAlerta("Información", "No hay registros en la tabla.");
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
    }

    private void mostrarAlerta(String titulo, String mensaje) {
        Alert alert = new Alert(AlertType.INFORMATION);
        alert.setTitle(titulo);
        alert.setHeaderText(null);
        alert.setContentText(mensaje);
        alert.showAndWait();
    }
}