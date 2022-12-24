/* Copyright (c) 2023, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */


package org.opfab.users.mongo.repositories;

import org.opfab.users.model.UserData;
import org.opfab.users.model.UserSettingsData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Mongo {@link UserData} repository
 *
 */
@Repository
public interface MongoUserSettingsRepository extends MongoRepository<UserSettingsData,String> {

}
