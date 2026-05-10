// Read-oriented projection of the museum entities.
// Coexists with MuseumService (which carries the actions and validation),
// kept as a clean catalog surface for read-only consumers.
using { museum as db } from '../db/schema';

service CatalogService {

  entity Tanks as projection on db.Tanks;

  entity Placements as projection on db.Placements;

  entity Locations as projection on db.Locations;

}
