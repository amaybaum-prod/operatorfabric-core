/* Copyright (c) 2021-2024, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */



package org.opfab.cards.publication.configuration.oauth2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;

import static org.opfab.springtools.configuration.oauth.OpfabAuthorizationManager.authenticated;

import static org.opfab.springtools.configuration.oauth.OpfabAuthorizationManager.hasAnyRole;
import static org.opfab.springtools.configuration.oauth.OpfabAuthorizationManager.hasAnyUsername;

import org.opfab.springtools.configuration.oauth.CustomAccessDeniedHandler;
import org.opfab.springtools.configuration.oauth.CustomAuthenticationEntryPoint;

/**
 * OAuth 2 http authentication configuration and access rules
 *
 *
 */
@Configuration
@Profile(value = {"!test"})
public class WebSecurityConfiguration {

    public static final String PROMETHEUS_PATH ="/actuator/prometheus**";
    public static final String LOGGERS_PATH ="/actuator/loggers/**";

    public static final String ADMIN_ROLE = "ADMIN";

    @Value("${operatorfabric.cards-publication.checkAuthenticationForCardSending:true}")
    private boolean checkAuthenticationForCardSending;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           Converter<Jwt, AbstractAuthenticationToken> opfabJwtConverter) throws Exception {
        configureCommon(http, checkAuthenticationForCardSending);
        http.csrf(csrf -> csrf.disable());
        http
                .oauth2ResourceServer(oauth2ResourceServer -> oauth2ResourceServer
                    .jwt(jwt -> jwt
                        .jwtAuthenticationConverter(opfabJwtConverter))
                        .authenticationEntryPoint(new CustomAuthenticationEntryPoint()));
        return http.build();
    }

    public static void configureCommon(final HttpSecurity http, boolean checkAuthenticationForCardSending) throws Exception {
        if (checkAuthenticationForCardSending) {
            http
                    .exceptionHandling(exceptionHandling -> exceptionHandling
                        .accessDeniedHandler(new CustomAccessDeniedHandler())
                        .authenticationEntryPoint(new CustomAuthenticationEntryPoint()))
                    .authorizeHttpRequests(authorizeHttpRequests -> authorizeHttpRequests
                        .requestMatchers(HttpMethod.GET, PROMETHEUS_PATH).permitAll()
                        .requestMatchers(LOGGERS_PATH).hasRole(ADMIN_ROLE)
                        .requestMatchers("/cards/userCard/**").access(authenticated())
                        .requestMatchers("/cards/translateCardField").access(authenticated())
                        .requestMatchers("/cards/resetReadAndAcks/**").access(hasAnyUsername("opfab"))
                        .requestMatchers(HttpMethod.DELETE, "/cards").access(hasAnyRole(ADMIN_ROLE))
                        .requestMatchers("/cards/rateLimiter").access(hasAnyRole(ADMIN_ROLE))
                        .requestMatchers("/**").access(authenticated())
                    );
        } else {
            http
                    .exceptionHandling(exceptionHandling -> exceptionHandling
                        .accessDeniedHandler(new CustomAccessDeniedHandler())
                        .authenticationEntryPoint(new CustomAuthenticationEntryPoint()))
                    .authorizeHttpRequests(authorizeHttpRequests -> authorizeHttpRequests
                        .requestMatchers(LOGGERS_PATH).hasRole(ADMIN_ROLE)
                        .requestMatchers("/cards/userCard/**").access(authenticated())
                        .requestMatchers("/cards/translateCardField").access(authenticated())
                        .requestMatchers("/cards/resetReadAndAcks/**").access(hasAnyUsername("opfab"))
                        .requestMatchers("/cards/rateLimiter").access(hasAnyRole(ADMIN_ROLE))
                        .requestMatchers("/**").permitAll()
                    );
        }
    }

}
