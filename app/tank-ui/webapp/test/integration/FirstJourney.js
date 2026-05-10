sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onTheTanksList.iSeeThisPage();
            Then.onTheTanksList.onTable().iCheckColumns(4, {"ID":{"header":"ID"},"name":{"header":"name"},"status":{"header":"status"},"country":{"header":"country"}});

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onTheTanksList.onFilterBar().iExecuteSearch();
            
            Then.onTheTanksList.onTable().iCheckRows();

            When.onTheTanksList.onTable().iPressRow(0);
            Then.onTheTanksObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});