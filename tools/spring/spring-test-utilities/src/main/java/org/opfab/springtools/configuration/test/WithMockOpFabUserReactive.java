/* Copyright (c) 2021-2024, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */



package org.opfab.springtools.configuration.test;

import org.opfab.users.model.PermissionEnum;
import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

/**
 * This annotation defines the creation of mock OpFab users for tests
 *
 *
 */
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockOpFabUserSecurityContextFactoryReactive.class)
public @interface WithMockOpFabUserReactive {

    String login() default "myUserLogin";

    String firstName() default  "myUserFirstName";

    String lastName() default  "myUserLastName";
    
    String comment() default  "";

    String[] groups() default "";

    PermissionEnum[] permissions() default {};

    String[] entities() default "";
}
