package com.example;

import java.util.HashMap;
import java.util.Map;

import com.example.APIConecction.ApiClient;

public class Main {
    public static void main(String[] args) {
        ApiClient apiClient = new ApiClient();
        String nombreTabla = "Usuarios"; // Aqui se puede cambiar el nombre de la tabla

        // Insertar un registro en la tabla
        //Map<String, Object> datos = new HashMap<>();
        //datos.put("nombre", "Joselin");
        //datos.put("email", "holasoyjoselin@gmail.com");
        //datos.put("contraseña_hash", "123456789");
        //datos.put("fecha_registro", "2025-02-25 17:58:36");
        //datos.put("rol", "admin");

        //String respuestaInsercion = apiClient.insertarRegistro(nombreTabla, datos);
        //System.out.println("Respuesta de la API (inserción): " + respuestaInsercion);

         // Actualizar un registro en la tabla
         String idColumna = "usuario_id"; // Nombre de la columna de identificación
         String id = "1"; // ID del registro a actualizar
         Map<String, Object> datosActualizados = new HashMap<>();
         datosActualizados.put("nombre", "Julio");
         datosActualizados.put("email", "holasoyjulio@gmail.com");
 
         String respuestaActualizacion = apiClient.actualizarRegistro(nombreTabla, idColumna, id, datosActualizados);
         System.out.println("Respuesta de la API (actualización): " + respuestaActualizacion);

        // Obtener los registros de la tabla sin filtros
        //String registros = apiClient.getRegistros(nombreTabla);
        //System.out.println("Respuesta de la API" + registros);

        // Obtener los registros de la tabla con filtros
        //Map<String, String> filtros = new HashMap<>();
        //filtros.put("rol", "admin"); // Filtro por rol
        //filtros.put("fecha_registro", "2022-01-01"); // Filtro por fecha de registro

        //String registrosConFiltros = apiClient.getRegistrosConFiltros(nombreTabla, filtros);
        //System.out.println("Respuesta de la API con filtros: " + registrosConFiltros);
    }
}