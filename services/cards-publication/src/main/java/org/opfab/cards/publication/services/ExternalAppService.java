/* Copyright (c) 2021-2024, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */
package org.opfab.cards.publication.services;

import lombok.extern.slf4j.Slf4j;

import org.opfab.cards.publication.configuration.ExternalRecipients;
import org.opfab.cards.publication.kafka.producer.ResponseCardProducer;
import org.opfab.cards.publication.model.Card;
import org.opfab.springtools.error.model.ApiError;
import org.opfab.springtools.error.model.ApiErrorException;
import org.springframework.http.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

@Service
@Slf4j
public class ExternalAppService {

    public static final String REMOTE_404_MESSAGE = "External application endpoint not found (HTTP 404)";
    public static final String UNEXPECTED_REMOTE_MESSAGE = "Unexpected behavior of external application endpoint";
    public static final String INVALID_URL_MESSAGE = "Url specified for external application is invalid";
    public static final String URL_NOT_FOUND_MESSAGE = "Url for external application not configured";
    public static final String NO_EXTERNALRECIPIENTS_MESSAGE = "No external recipients found in the card";
    public static final String ERR_CONNECTION_REFUSED = "I/O exception accessing external application endpoint";

    private ExternalRecipients externalRecipients;
    private RestTemplate restTemplate;
    private ResponseCardProducer responseCardProducer;
    private final ObjectMapper mapper;

    public ExternalAppService(ExternalRecipients externalRecipients, RestTemplate restTemplate,
            ResponseCardProducer responseCardProducer, ObjectMapper mapper) {
        this.externalRecipients = externalRecipients;
        this.restTemplate = restTemplate;
        this.responseCardProducer = responseCardProducer;
        this.mapper = mapper;
    }

    public void sendCardToExternalApplication(Card card, Optional<Jwt> jwt) {

        Optional<List<String>> externalRecipientsFromCard = Optional.ofNullable(card.getExternalRecipients());
        if (externalRecipientsFromCard.isPresent() && !externalRecipientsFromCard.get().isEmpty()) {

            externalRecipientsFromCard.get().stream()
                    .forEach(item -> {
                        Optional<ExternalRecipients.ExternalRecipient> externalRecipient = getExternalRecipient(item);
                        if (externalRecipient.isPresent()) {
                            ExternalRecipients.ExternalRecipient recipient = externalRecipient.get();
                            callExternalApplication(card, recipient.getUrl(),
                                    recipient.isPropagateUserToken() ? jwt : Optional.empty());
                        } else
                            throw createApiError(HttpStatus.BAD_REQUEST, INVALID_URL_MESSAGE);

                    });
        } else {
            log.debug(NO_EXTERNALRECIPIENTS_MESSAGE + " {} from {}", card.getId(), card.getPublisher());
        }
    }

    public void notifyExternalApplicationThatCardIsDeleted(Card card, Optional<Jwt> jwt) {

        Optional<List<String>> externalRecipientsFromCard = Optional.ofNullable(card.getExternalRecipients());
        if (externalRecipientsFromCard.isPresent() && !externalRecipientsFromCard.get().isEmpty()) {

            externalRecipientsFromCard.get().stream()
                    .forEach(item -> {

                        Optional<ExternalRecipients.ExternalRecipient> externalRecipient = getExternalRecipient(item);
                        if (externalRecipient.isPresent()) {
                            ExternalRecipients.ExternalRecipient recipient = externalRecipient.get();
                            notifyExternalApplication(card, recipient.getUrl(),
                                    recipient.isPropagateUserToken() ? jwt : Optional.empty());
                        } else {
                            log.debug("ExternalRecipient extracted from {} is empty", item);
                        }
                    });
        } else {
            log.debug(NO_EXTERNALRECIPIENTS_MESSAGE + " {} from {}", card.getId(), card.getPublisher());
        }
    }

    private Optional<ExternalRecipients.ExternalRecipient> getExternalRecipient(String item) {
        return externalRecipients
                .getRecipients()
                .stream()
                .filter(x -> x.getId().equals(item))
                .findFirst();
    }

    private void callExternalApplication(Card card, String externalRecipientUrl, Optional<Jwt> jwt) {
        if (externalRecipientUrl.startsWith("kafka:")) {
            callExternalKafkaApplication(card);
        } else {
            callExternalHttpApplication(card, externalRecipientUrl, jwt);
        }
    }

    private void notifyExternalApplication(Card card, String externalRecipientUrl, Optional<Jwt> jwt) {
        if (externalRecipientUrl.startsWith("kafka:")) {
            notifyExternalKafkaApplication(card);
        } else {
            notifyExternalHttpApplication(card, externalRecipientUrl, jwt);
        }
    }

    private void callExternalKafkaApplication(Card card) {
        responseCardProducer.send(card);
    }

    private void notifyExternalKafkaApplication(Card card) {
        log.warn("Kafka card suppression notification not implemented");
    }

    private void callExternalHttpApplication(Card card, String externalRecipientUrl, Optional<Jwt> jwt) {
        try {
            log.debug("Start to Send card {} To {} ", card.getId(), card.getPublisher());
            HttpHeaders headers = createRequestHeader(jwt);
            String cardJson = mapper.writeValueAsString(card);
            HttpEntity<String> requestBody = new HttpEntity<>(cardJson, headers);
            restTemplate.postForObject(externalRecipientUrl, requestBody, Void.class);
            log.debug("End to Send card {} \n", card);

        } catch (JsonProcessingException ex) {
            log.error("Error converting card to Json string", ex);
            throwException(ex);
        } catch (Exception ex) {
            log.error("Error calling external application ", ex);
            throwException(ex);
        }

    }

    private void notifyExternalHttpApplication(Card card, String externalRecipientUrl, Optional<Jwt> jwt) {
        try {
            HttpHeaders headers = createRequestHeader(jwt);
            HttpEntity<String> requestBody = new HttpEntity<>("", headers);
            restTemplate.exchange(externalRecipientUrl + "/" + card.getId(), HttpMethod.DELETE, requestBody,
                    Void.class);

        } catch (Exception ex) {
            log.error("Error sending card deletion notification to external application ", ex);
            throwException(ex);
        }

    }

    private void throwException(Exception e) {
        if (e instanceof HttpClientErrorException.NotFound) {
            throw createApiError(HttpStatus.INTERNAL_SERVER_ERROR, REMOTE_404_MESSAGE);
        } else if (e instanceof HttpClientErrorException || e instanceof HttpServerErrorException) {
            throw createApiError(((HttpStatusCodeException) e).getStatusCode(), UNEXPECTED_REMOTE_MESSAGE);
        } else if (e instanceof IllegalArgumentException) {
            throw createApiError(HttpStatus.BAD_REQUEST, INVALID_URL_MESSAGE);
        } else if (e instanceof ResourceAccessException) {
            throw createApiError(HttpStatus.BAD_GATEWAY, ERR_CONNECTION_REFUSED);
        } else {
            throw createApiError(HttpStatus.BAD_GATEWAY, UNEXPECTED_REMOTE_MESSAGE);
        }
    }

    private ApiErrorException createApiError(HttpStatusCode httpStatus, String errorMessage) {
        return new ApiErrorException(ApiError.builder()
                .status(httpStatus)
                .message(errorMessage)
                .build());
    }

    private HttpHeaders createRequestHeader(Optional<Jwt> jwt) {
        HttpHeaders headers = new HttpHeaders();
        List<Charset> acceptCharset = Collections.singletonList(StandardCharsets.UTF_8);
        headers.setAcceptCharset(acceptCharset);
        headers.add("Accept", MediaType.APPLICATION_JSON_VALUE);
        if (jwt.isPresent())
            headers.setBearerAuth(jwt.get().getTokenValue());

        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
