package com.example;

import java.util.HashMap;
import java.util.Map;

import com.example.APIConecction.ApiClient;

public class Main {
    public static void main(String[] args) {
        ApiClient apiClient = new ApiClient();
        String nombreTabla = "Usuarios"; // Aqui se puede cambiar el nombre de la tabla

        // Obtener los registros de la tabla sin filtros
        String registros = apiClient.getRegistros(nombreTabla);
        System.out.println("Respuesta de la API" + registros);

        // Obtener los registros de la tabla con filtros
        Map<String, String> filtros = new HashMap<>();
        filtros.put("rol", "admin"); // Filtro por rol
        //filtros.put("fecha_registro", "2022-01-01"); // Filtro por fecha de registro

        String registrosConFiltros = apiClient.getRegistrosConFiltros(nombreTabla, filtros);
        System.out.println("Respuesta de la API con filtros: " + registrosConFiltros);
    }
}