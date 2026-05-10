namespace museum;

using { managed } from '@sap/cds/common';

type TankStatus : String enum {
  IN_STORAGE;
  ON_DISPLAY;
  UNDER_RESTORATION;
}

type LocationKind : String enum {
  HALL;
  OUTDOOR;
  WORKSHOP;
  STORAGE;
  OFFSITE;
}

entity Tanks : managed {
  key ID           : Integer;
  name             : String(100) @mandatory @assert.unique;
  countryOfOrigin  : String(100);
  yearIntroduced   : Integer;
  status           : TankStatus default 'IN_STORAGE';
  placements       : Association to many Placements
                       on placements.tank = $self;
}

entity Locations : managed {
  key ID           : Integer;
  name             : String(100) @mandatory @assert.unique;
  type             : LocationKind;
  description      : String(255);
  placements       : Association to many Placements
                       on placements.location = $self;
}

entity Placements : managed {
  key ID           : Integer;
  tank             : Association to Tanks @mandatory;
  location         : Association to Locations @mandatory;
  fromDate         : Date @mandatory;
  toDate           : Date;
  note             : String(255);
}
