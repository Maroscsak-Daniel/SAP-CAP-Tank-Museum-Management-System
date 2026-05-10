sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"tankui/tankui/test/integration/pages/TanksList",
	"tankui/tankui/test/integration/pages/TanksObjectPage",
	"tankui/tankui/test/integration/pages/PlacementsObjectPage"
], function (JourneyRunner, TanksList, TanksObjectPage, PlacementsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('tankui/tankui') + '/test/flp.html#app-preview',
        pages: {
			onTheTanksList: TanksList,
			onTheTanksObjectPage: TanksObjectPage,
			onThePlacementsObjectPage: PlacementsObjectPage
        },
        async: true
    });

    return runner;
});

