package com.example;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.example.APIConecction.ApiClient;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

public class LoginController {

    @FXML
    private TextField emailField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private Button loginButton;

    @FXML
    private Label statusLabel;

    private ApiClient apiClient;

    @FXML
    public void initialize() {
        apiClient = new ApiClient();
    }

    @FXML
    private void handleLogin(ActionEvent event) {
        String email = emailField.getText().trim();
        String password = passwordField.getText().trim();
    
        // Validación básica
        if (email.isEmpty() || password.isEmpty()) {
            statusLabel.setText("Por favor, introduce email y contraseña");
            return;
        }
    
        // Crear filtros para la consulta
        Map<String, String> filtros = new HashMap<>();
        filtros.put("email", email);
    
        // Consultar usuario por email
        String response = apiClient.getRegistrosConFiltros("Usuarios", filtros);
        
        // Respuesta del servidor
        System.out.println("Respuesta del servidor: " + response);
    
        try {
            // Verificar si la respuesta es un JSON válido
            if (!response.startsWith("[")) {
                statusLabel.setText("Error en la autenticación: Respuesta no válida");
                return;
            }
    
            JSONArray usuarios = new JSONArray(response);
            
            // Comprobar si existe el usuario
            if (usuarios.length() == 0) {
                statusLabel.setText("Usuario no encontrado");
                return;
            }
            
            JSONObject usuario = usuarios.getJSONObject(0);
            String storedPassword = usuario.getString("contraseña_hash");
            String rol = usuario.getString("rol");
            
            // Verificar contraseña (en un entorno real, deberías usar hash seguro)
            if (password.equals(storedPassword)) {
                // Autenticación exitosa
                // Guardar información del usuario para uso posterior (por ejemplo, para verificar permisos)
                UserSession.getInstance().setUsuario(usuario);
                
                // Solo permitir acceso a administradores
                if (!"admin".equals(rol)) {
                    statusLabel.setText("Acceso denegado: Se requiere rol de administrador");
                    return;
                }
                
                // Cargar la interfaz principal
                loadMainInterface(event);
            } else {
                statusLabel.setText("Contraseña incorrecta");
            }
        } catch (JSONException e) {
            statusLabel.setText("Error en la autenticación: JSON inválido");
            e.printStackTrace();
        } catch (Exception e) {
            statusLabel.setText("Error en la autenticación: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void loadMainInterface(ActionEvent event) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/InterfazJardin.fxml"));
            Parent mainView = loader.load();
            Scene scene = new Scene(mainView);
            
            // Obtener la ventana actual
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(scene);
            stage.setTitle("Jardines Oasis S.L. - Panel de Administración");
            stage.centerOnScreen();
            stage.show();
        } catch (IOException e) {
            statusLabel.setText("Error al cargar la interfaz principal: " + e.getMessage());
            e.printStackTrace();
        }
    }
}