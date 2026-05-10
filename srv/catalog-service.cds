using { museum as db } from '../db/schema';

service CatalogService {

  entity Tanks as projection on db.Tanks;
  
  entity Placements as projection on db.Placements;

  entity Locations as projection on db.Locations;

}