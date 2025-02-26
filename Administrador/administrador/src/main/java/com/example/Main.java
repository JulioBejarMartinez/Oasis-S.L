package com.example;

import com.example.APIConecction.ApiClient;

public class Main {
    public static void main(String[] args) {
        ApiClient apiClient = new ApiClient();
        String nombreTabla = "Usuarios"; // Aqui se puede cambiar el nombre de la tabla
        String registros = apiClient.getRegistros(nombreTabla);
        System.out.println("Respuesta de la API" + registros);
    }
}