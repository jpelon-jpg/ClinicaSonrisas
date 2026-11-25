package com.sonrisa.api.service;

import com.sonrisa.api.dto.PageResponse;
import com.sonrisa.api.dto.TratamientoRequest;
import com.sonrisa.api.dto.TratamientoResponse;
import com.sonrisa.api.entity.Tratamiento;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.ResourceNotFoundException;
import com.sonrisa.api.repository.Specs;
import com.sonrisa.api.repository.TratamientoRepository;
import com.sonrisa.api.util.DtoMapper;
import com.sonrisa.api.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TratamientoService {

    private static final Set<String> ORDEN = Set.of("id", "nombre", "precio", "duracionMin");

    private final TratamientoRepository repo;

    @Transactional(readOnly = true)
    public PageResponse<TratamientoResponse> listar(String q, Boolean activo, int page, int size, String sort) {
        return PageResponse.of(repo.findAll(Specs.tratamientos(q, activo), Paginacion.de(page, size, sort, ORDEN, "nombre")),
                DtoMapper::tratamiento);
    }

    @Transactional(readOnly = true)
    public List<TratamientoResponse> activos() {
        return repo.findByActivoTrueOrderByNombreAsc().stream().map(DtoMapper::tratamiento).toList();
    }

    @Transactional(readOnly = true)
    public TratamientoResponse obtener(Long id) {
        return DtoMapper.tratamiento(buscar(id));
    }

    @Transactional
    public TratamientoResponse crear(TratamientoRequest req) {
        if (repo.existsByNombreIgnoreCase(req.nombre().trim())) {
            throw new BusinessRuleException("Ya existe un tratamiento con ese nombre");
        }
        Tratamiento t = new Tratamiento();
        aplicar(t, req);
        return DtoMapper.tratamiento(repo.save(t));
    }

    @Transactional
    public TratamientoResponse actualizar(Long id, TratamientoRequest req) {
        Tratamiento t = buscar(id);
        if (repo.existsByNombreIgnoreCaseAndIdNot(req.nombre().trim(), id)) {
            throw new BusinessRuleException("Ya existe otro tratamiento con ese nombre");
        }
        aplicar(t, req);
        return DtoMapper.tratamiento(t);
    }

    @Transactional
    public void eliminar(Long id) {
        Tratamiento t = buscar(id);
        if (repo.estaEnUso(id)) {
            throw new BusinessRuleException("El tratamiento ya se usó en citas; desactívalo en lugar de eliminarlo");
        }
        repo.delete(t);
    }

    private Tratamiento buscar(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));
    }

    private void aplicar(Tratamiento t, TratamientoRequest req) {
        t.setNombre(req.nombre().trim());
        t.setDescripcion(req.descripcion());
        t.setDuracionMin(req.duracionMin());
        t.setPrecio(req.precio());
        if (req.activo() != null) t.setActivo(req.activo());
    }
}
