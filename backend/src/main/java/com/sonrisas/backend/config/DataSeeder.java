package com.sonrisas.backend.config;

import com.sonrisas.backend.model.Rol;
import com.sonrisas.backend.model.Usuario;
import com.sonrisas.backend.repository.RolRepository;
import com.sonrisas.backend.repository.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                      PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        crearSiNoExiste("Roberto", "Salinas", "admin@sonrisa.com", "Admin#2026", "ADMINISTRADOR");
    }

    private void crearSiNoExiste(String nombre, String apellidos, String correo,
                                 String password, String nombreRol) {
        if (usuarioRepository.existsByCorreo(correo)) return;
        Rol rol = rolRepository.findByNombre(nombreRol).orElseThrow();
        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setApellidos(apellidos);
        u.setCorreo(correo);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setRol(rol);
        usuarioRepository.save(u);
    }
}