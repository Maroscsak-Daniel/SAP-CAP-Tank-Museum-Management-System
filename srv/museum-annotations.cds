annotate srv.MuseumService.Tanks with @(
  UI.LineItem: [
    { Value: ID },
    { Value: name },
    { Value: status },
    { Value: countryOfOrigin },
    { Value: yearIntroduced }
  ],
  UI.Identification: [
    { Value: name },
    { Value: status },
    { Value: countryOfOrigin },
    {
      $Type: 'UI.DataFieldForAction',
      Action: 'MuseumService.moveTank',
      Label: 'Move Tank'
    }
  ],
  UI.Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      Label: 'Placements',
      Target: 'placements/@UI.LineItem'
    }
  ]
);

annotate service.MuseumService.Tanks.moveTank with @(
  UI.ParameterDialog: {
    title: 'Move Tank'
  },
  UI.Parameters: [
    {
      $Type: 'UI.DataField',
      Value: location_ID,
      Label: 'Location'
    },
    {
      $Type: 'UI.DataField',
      Value: fromDate
    },
    {
      $Type: 'UI.DataField',
      Value: note
    }
  ]
);

annotate service.MuseumService.Placements with @(
  UI.LineItem: [
    { Value: location.name, Label: 'Location' },
    { Value: fromDate },
    { Value: toDate },
    { Value: note }
  ]
);