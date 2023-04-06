#!/bin/bash

# Copyright (c) 2023, RTE (http://www.rte-france.com)
# See AUTHORS.txt
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0
# This file is part of the OperatorFabric project.

# This starts by moving to the directory where the script is located so the paths below still work even if the script
# is called from another folder
cd "$(dirname "${BASH_SOURCE[0]}")"

url=$2 
if [ -z $url ] 
then
	url="http://localhost"
fi
if [ -z $1 ]
then
    echo "Usage : deleteBusinessData businessData_name opfab_url"
else
	echo "Will delete businessData $1 on $url"
	source ../getToken.sh "admin" $url
	curl -s -X DELETE "$url:2100/businessconfig/businessData/$1" -H "accept: application/json" -H "Authorization:Bearer $token"
	echo ""
fi


