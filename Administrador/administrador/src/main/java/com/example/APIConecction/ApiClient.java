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
}
