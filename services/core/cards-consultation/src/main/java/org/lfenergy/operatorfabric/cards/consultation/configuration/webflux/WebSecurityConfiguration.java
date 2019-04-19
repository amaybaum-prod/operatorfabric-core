/* Copyright (c) 2018, RTE (http://www.rte-france.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

package org.lfenergy.operatorfabric.cards.consultation.configuration.webflux;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authorization.AuthorityReactiveAuthorizationManager;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authorization.AuthorizationContext;
import reactor.core.publisher.Mono;


/**
 * Configures web security
 *
 * @author David Binder
 */
@Configuration
@Slf4j
@EnableWebFluxSecurity
public class WebSecurityConfiguration {

    /**
     * Secures access (all uris are secured)
     *
     * @param httpSecurity
     *    http security configuration
     * @param opfabReactiveJwtConverter
     *    OperatorFabric authentication converter
     * @return http security filter chain
     */
    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity httpSecurity,
                                                            Converter<Jwt, Mono<AbstractAuthenticationToken>>
                                                                    opfabReactiveJwtConverter) {
        httpSecurity
                .headers()
                .frameOptions()
                .disable();
        httpSecurity
                .authorizeExchange()
                .pathMatchers(HttpMethod.OPTIONS).permitAll()
                .pathMatchers("/cards/**").access(this::currentUserHasAnyRole)
                .pathMatchers("/cardSubscription/**").access(this::currentUserHasAnyRole)
                .anyExchange().authenticated()
                .and()
                .oauth2ResourceServer()
                .jwt()
                .jwtAuthenticationConverter(opfabReactiveJwtConverter);

        return httpSecurity.build();
    }

    private Mono<AuthorizationDecision> currentUserHasAnyRole(Mono<Authentication> authentication, AuthorizationContext context) {
        return authentication
                .filter(a -> a.isAuthenticated())
                .flatMapIterable( a -> a.getAuthorities())
                .hasElements()
                .map(hasAuthorities -> new AuthorizationDecision(hasAuthorities))
                .defaultIfEmpty(new AuthorizationDecision(false))
                ;
    }


}
