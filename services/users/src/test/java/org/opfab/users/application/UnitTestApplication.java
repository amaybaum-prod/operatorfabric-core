/* Copyright (c) 2018-2023, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

package org.opfab.users.application;

import org.opfab.springtools.configuration.mongo.EnableOperatorFabricMongo;
import org.opfab.springtools.configuration.oauth.jwt.JwtProperties;
import org.opfab.springtools.configuration.oauth.jwt.groups.GroupsProperties;
import org.opfab.springtools.configuration.oauth.jwt.groups.GroupsUtils;
import org.opfab.users.UsersApplication;
import org.opfab.users.configuration.DataInitComponent;
import org.opfab.users.configuration.json.JacksonConfig;
import org.opfab.users.configuration.mongo.LocalMongoConfiguration;
import org.opfab.users.configuration.users.UsersProperties;
import org.opfab.users.controllers.*;
import org.opfab.users.mongo.repositories.EntityRepositoryImpl;
import org.opfab.users.mongo.repositories.GroupRepositoryImpl;
import org.opfab.users.mongo.repositories.PerimeterRepositoryImpl;
import org.opfab.users.mongo.repositories.UserRepositoryImpl;
import org.opfab.users.mongo.repositories.UserSettingsRepositoryImpl;
import org.opfab.users.rabbit.RabbitEventBus;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.ImportResource;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableOperatorFabricMongo
@EnableConfigurationProperties
@EnableMongoRepositories(basePackageClasses = UsersApplication.class)
@Import({ JacksonConfig.class, LocalMongoConfiguration.class, UsersProperties.class, CustomExceptionHandler.class,
        GroupsController.class, EntitiesController.class, UsersController.class, PerimetersController.class,
        CurrentUserWithPerimetersController.class, DataInitComponent.class, GroupsProperties.class, GroupsUtils.class,
        JwtProperties.class, EntityRepositoryImpl.class, GroupRepositoryImpl.class,
        PerimeterRepositoryImpl.class, UserRepositoryImpl.class,UserSettingsRepositoryImpl.class, RabbitEventBus.class })
@ImportResource("classpath:/security.xml")
public class UnitTestApplication {

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(UnitTestApplication.class, args);
        assert (ctx != null);
    }

}
