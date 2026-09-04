package com.m2c.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/health/**",
            "/api/oauth/**",
            "/api/rooms/public",
            "/api/contests/**",
            "/api/documents/**",
            "/api/whiteboard/**",
            "/api/questions/**",
            "/api/leetcode/**",
            "/ws/**",
            "/v3/api-docs/**",
            "/swagger-ui.html",
            "/swagger-ui/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rooms/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/execute").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/rooms/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/rooms/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/rooms/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/contests/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/contests/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/contests/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/documents/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/documents/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/documents/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/whiteboard/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/whiteboard/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/whiteboard/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/oauth/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/oauth/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/oauth/**").authenticated()
                        .anyRequest().authenticated()
                )
                .logout(logout -> logout.logoutUrl("/api/oauth/logout").permitAll());
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
