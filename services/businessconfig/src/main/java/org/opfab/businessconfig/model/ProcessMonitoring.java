/* Copyright (c) 2024, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

package org.opfab.businessconfig.model;

import java.util.List;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonInclude;
/**
 * Configuration for the process monitoring screen
 */

@Validated
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProcessMonitoring (
    List<ProcessMonitoringField> fields,
    List<ProcessMonitoringFieldsForProcess> fieldsForProcesses,
    ProcessMonitoringFilters filters
) {
}


