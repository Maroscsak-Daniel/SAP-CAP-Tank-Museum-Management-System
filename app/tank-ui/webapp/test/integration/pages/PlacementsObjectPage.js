sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'tankui.tankui',
            componentId: 'PlacementsObjectPage',
            contextPath: '/Tanks/placements'
        },
        CustomPageDefinitions
    );
});