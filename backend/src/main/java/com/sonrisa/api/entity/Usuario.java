package com.sonrisa.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 120)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** Hash BCrypt. Es nulo para quien solo entra con Google o Facebook. */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(length = 20)
    private String telefono;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProveedorAuth proveedor = ProveedorAuth.LOCAL;

    @Column(name = "proveedor_id", length = 100)
    private String proveedorId;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "debe_cambiar_password", nullable = false)
    private boolean debeCambiarPassword = false;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    /** Relación N:M con roles. @BatchSize evita el problema N+1 al listar usuarios. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "usuario_roles",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "rol_id"))
    @BatchSize(size = 50)
    private Set<Rol> roles = new HashSet<>();

    public String getNombreCompleto() {
        return nombre + " " + apellidos;
    }

    public boolean tieneRol(NombreRol rol) {
        return roles.stream().anyMatch(r -> r.getNombre() == rol);
    }
}
