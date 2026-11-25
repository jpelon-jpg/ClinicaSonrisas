package com.sonrisa.api.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

/** Construye el Pageable a partir de los parámetros de la petición (paginación del lado del servidor). */
public final class Paginacion {

    private Paginacion() {
    }

    public static Pageable de(int page, int size, String sort, Set<String> permitidos, String porDefecto) {
        int pagina = Math.max(page, 0);
        int tamano = Math.min(Math.max(size, 1), 50);
        String campo = porDefecto;
        Sort.Direction dir = Sort.Direction.ASC;
        if (sort != null && !sort.isBlank()) {
            String[] partes = sort.split(",");
            if (permitidos.contains(partes[0])) {
                campo = partes[0];
            }
            if (partes.length > 1 && partes[1].equalsIgnoreCase("desc")) {
                dir = Sort.Direction.DESC;
            }
        } else if (porDefecto.startsWith("-")) {
            campo = porDefecto.substring(1);
            dir = Sort.Direction.DESC;
        }
        return PageRequest.of(pagina, tamano, Sort.by(dir, campo));
    }
}
