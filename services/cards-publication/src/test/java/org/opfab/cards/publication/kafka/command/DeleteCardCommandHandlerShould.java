/* Copyright (c) 2020, Alliander (http://www.alliander.com)
 * Copyright (c) 2021-2024, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */
package org.opfab.cards.publication.kafka.command;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.opfab.avro.Card;
import org.opfab.avro.CardCommand;
import org.opfab.avro.CommandType;
import org.opfab.cards.publication.configuration.Services;
import org.opfab.cards.publication.kafka.CardObjectMapper;
import org.opfab.cards.publication.services.CardDeletionService;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.notNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DeleteCardCommandHandlerShould {

    private Services services;

    private CardDeletionService cardDeletionService;

    private CardObjectMapper objectMapper;

    private DeleteCardCommandHandler cut;

    @BeforeAll
    public void setUp() {
        services = mock(Services.class);
        cardDeletionService = mock(CardDeletionService.class);
        objectMapper = mock(CardObjectMapper.class);
        cut = new DeleteCardCommandHandler(services);
        ReflectionTestUtils.setField(cut, "objectMapper", objectMapper);
    }

    @Test
    void getCommandType() {
        assertThat(cut.getCommandType()).isEqualTo(CommandType.DELETE_CARD);
    }

    @Test
    void executeCommand() throws JsonProcessingException {
        CardCommand cardCommandMock = mock(CardCommand.class);
        org.opfab.cards.publication.model.Card cardPublicationDataMock = mock(
                org.opfab.cards.publication.model.Card.class);
        Card cardMock = mock(Card.class);
        when(cardCommandMock.getCard()).thenReturn(cardMock);
        when(objectMapper.writeValueAsString(any())).thenReturn("");
        when(objectMapper.readCardPublicationDataValue(anyString())).thenReturn(cardPublicationDataMock);
        when(services.getCardDeletionService()).thenReturn(cardDeletionService);
        cut.executeCommand(cardCommandMock);

        verify(cardDeletionService, times(1))
                .deleteCardById(any(),notNull(),any());
    }

}
