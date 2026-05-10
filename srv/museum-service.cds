using { museum as db } from '../db/schema';

service MuseumService {

  @odata.draft.enabled
  entity Tanks as projection on db.Tanks actions {
    action moveTank(
      location_ID : Integer,
      fromDate    : Date,
      note        : String
    ) returns Placements;
  };

  entity Locations  as projection on db.Locations;
  entity Placements as projection on db.Placements;

  action getCurrentPlacements() returns array of Placements;

  action getLocationStats() returns array of {
    location_ID  : Integer;
    locationName : String;
    tankCount    : Integer;
  };
}