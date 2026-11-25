package com.sonrisa.api.security;

import com.sonrisa.api.entity.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/** Usuario autenticado que Spring Security guarda en el contexto. */
public record AuthUser(Long id, String email, String password, boolean activo, List<String> roles) implements UserDetails {

    public static AuthUser from(Usuario u) {
        List<String> roles = u.getRoles().stream().map(r -> r.getNombre().name()).sorted().toList();
        return new AuthUser(u.getId(), u.getEmail(), u.getPasswordHash(), u.isActivo(), roles);
    }

    public boolean tieneRol(String rol) {
        return roles.contains(rol);
    }

    public boolean tieneRol(com.sonrisa.api.entity.NombreRol rol) {
        return roles.contains(rol.name());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }
}
