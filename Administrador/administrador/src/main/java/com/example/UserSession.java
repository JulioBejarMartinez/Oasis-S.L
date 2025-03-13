package com.example;

import org.json.JSONObject;

// Clase singleton para gestionar la sesión del usuario
public class UserSession {
    private static UserSession instance;
    private JSONObject usuario;

    private UserSession() {
        // Constructor privado para Singleton
    }

    public static UserSession getInstance() {
        if (instance == null) {
            instance = new UserSession();
        }
        return instance;
    }

    public JSONObject getUsuario() {
        return usuario;
    }

    public void setUsuario(JSONObject usuario) {
        this.usuario = usuario;
    }

    public String getRol() {
        return usuario != null ? usuario.getString("rol") : null;
    }

    public int getUsuarioId() {
        return usuario != null ? usuario.getInt("usuario_id") : -1;
    }

    public String getNombre() {
        return usuario != null ? usuario.getString("nombre") : null;
    }

    public void clearSession() {
        usuario = null;
    }
}
