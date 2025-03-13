package com.example.APIConecction;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.StringJoiner;

public class ApiClient {

    private static final String API_URL = "http://localhost:3000/";

    // Metodo para obtener los registros de una tabla
    // Recibe el nombre de la tabla como parametro
    // Retorna un string con los registros de la tabla
    public String getRegistros(String nombreTabla){
        String response = "";
        try{
            String endpoint = API_URL + "tabla/"  + nombreTabla;
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(endpoint))
                    .GET()
                    .build();

            HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
            response = httpResponse.body();
        } catch (Exception e){
            e.printStackTrace();
        }
        return response;
    }

    // Metodo para obtener los registros de una tabla con filtros
    // Recibe el nombre de la tabla y un mapa con los filtros
    // Retorna un string con los registros de la tabla que cumplen con los filtros
    public String getRegistrosConFiltros(String nombreTabla, Map<String, String> filtros) {
        String response = "";
        try {
            StringJoiner queryParams = new StringJoiner("&");
            for (Map.Entry<String, String> filtro : filtros.entrySet()) {
                queryParams.add(filtro.getKey() + "=" + filtro.getValue());
            }
    
            String endpoint = API_URL + "tabla/" + nombreTabla + "/filtrar?" + queryParams.toString();
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(endpoint))
                    .GET()
                    .build();
    
            HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
            response = httpResponse.body();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

    // Metodo para insertar un registro en una tabla
    // Recibe el nombre de la tabla y un mapa con los datos del registro

    public String insertarRegistro(String nombreTabla, Map<String, Object> datos) {
        String response = "";
        try {
            String endpoint = API_URL + "tabla/" + nombreTabla;
            HttpClient client = HttpClient.newHttpClient();

            StringJoiner jsonDatos = new StringJoiner(",", "{", "}");
            for (Map.Entry<String, Object> entry : datos.entrySet()) {
                jsonDatos.add("\"" + entry.getKey() + "\":\"" + entry.getValue().toString() + "\"");
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(endpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonDatos.toString()))
                    .build();

            HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
            response = httpResponse.body();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

    // Metodo para actualizar un registro en una tabla
    // Recibe el nombre de la tabla, el id del registro y un mapa con los datos a actualizar
    // Retorna un string con la respuesta del servidor
    
    public String actualizarRegistro(String nombreTabla, String idColumna, String id, Map<String, Object> datos) {
        String response = "";
        try {
            String endpoint = API_URL + "tabla/" + nombreTabla + "/" + id + "?idColumna=" + idColumna;
            HttpClient client = HttpClient.newHttpClient();

            StringJoiner jsonDatos = new StringJoiner(",", "{", "}");
            for (Map.Entry<String, Object> entry : datos.entrySet()) {
                jsonDatos.add("\"" + entry.getKey() + "\":\"" + entry.getValue().toString() + "\"");
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(endpoint))
                    .header("Content-Type", "application/json")
                    .PUT(HttpRequest.BodyPublishers.ofString(jsonDatos.toString()))
                    .build();

            HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
            response = httpResponse.body();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

    // Metodo para borrar un registro en una tabla
    // Recibe el nombre de la tabla, el id del registro y el nombre de la columna id
    // Retorna un string con la respuesta del servidor
    public String borrarRegistro(String nombreTabla, String idColumna, String id) {
        String response = "";
        try {
            String endpoint = API_URL + "tabla/" + nombreTabla + "/" + id + "?idColumna=" + idColumna;
            HttpClient client = HttpClient.newHttpClient();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(endpoint))
                    .header("Content-Type", "application/json")
                    .DELETE()
                    .build();

            HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
            response = httpResponse.body();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

}