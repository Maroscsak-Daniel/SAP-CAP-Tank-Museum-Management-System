using MuseumService as service from '../../srv/museum-service';

// ============================================================================
// Field labels — drive every column header, dialog field, and detail row
// ============================================================================

annotate service.Tanks with {
  ID              @Common.Label: 'Tank ID';
  name            @Common.Label: 'Name';
  countryOfOrigin @Common.Label: 'Country of Origin';
  yearIntroduced  @Common.Label: 'Year Introduced';
  status          @Common.Label: 'Status';
};

annotate service.Locations with {
  ID          @Common.Label: 'Location ID';
  name        @Common.Label: 'Name';
  type        @Common.Label: 'Kind';
  description @Common.Label: 'Description';
};

annotate service.Placements with {
  ID       @Common.Label: 'Placement ID';
  tank     @Common.Label: 'Tank';
  location @Common.Label: 'Location';
  fromDate @Common.Label: 'From';
  toDate   @Common.Label: 'To';
  note     @Common.Label: 'Note';
};

// ============================================================================
// Tanks — List Report
// ============================================================================

annotate service.Tanks with @(
  UI.SelectionFields: [
    name,
    status,
    countryOfOrigin
  ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: name },
    { $Type: 'UI.DataField', Value: status },
    { $Type: 'UI.DataField', Value: countryOfOrigin },
    { $Type: 'UI.DataField', Value: yearIntroduced }
  ]
);

// ============================================================================
// Tanks — Object Page
// ============================================================================

annotate service.Tanks with @(
  UI.HeaderInfo: {
    TypeName       : 'Tank',
    TypeNamePlural : 'Tanks',
    Title          : { Value: name },
    Description    : { Value: status }
  },
  UI.Identification: [
    { $Type: 'UI.DataField', Value: name },
    { $Type: 'UI.DataField', Value: status },
    { $Type: 'UI.DataField', Value: countryOfOrigin },
    {
      $Type  : 'UI.DataFieldForAction',
      Action : 'MuseumService.moveTank',
      Label  : 'Move Tank'
    }
  ],
  UI.FieldGroup #GeneralInfo: {
    Data: [
      { $Type: 'UI.DataField', Value: ID },
      { $Type: 'UI.DataField', Value: name },
      { $Type: 'UI.DataField', Value: countryOfOrigin },
      { $Type: 'UI.DataField', Value: yearIntroduced },
      { $Type: 'UI.DataField', Value: status }
    ]
  },
  UI.Facets: [
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'GeneralInfoFacet',
      Label  : 'General Information',
      Target : '@UI.FieldGroup#GeneralInfo'
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'PlacementsFacet',
      Label  : 'Placements',
      Target : 'placements/@UI.LineItem'
    }
  ]
);

// ============================================================================
// Placements — sub-table inside Tank object page + own object page
// ============================================================================

annotate service.Placements with @(
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: location.name, Label: 'Location' },
    { $Type: 'UI.DataField', Value: fromDate },
    { $Type: 'UI.DataField', Value: toDate },
    { $Type: 'UI.DataField', Value: note }
  ],
  UI.HeaderInfo: {
    TypeName       : 'Placement',
    TypeNamePlural : 'Placements',
    Title          : { Value: location.name },
    Description    : { Value: fromDate }
  },
  UI.FieldGroup #PlacementInfo: {
    Data: [
      { $Type: 'UI.DataField', Value: ID },
      { $Type: 'UI.DataField', Value: location.name, Label: 'Location' },
      { $Type: 'UI.DataField', Value: fromDate },
      { $Type: 'UI.DataField', Value: toDate },
      { $Type: 'UI.DataField', Value: note }
    ]
  },
  UI.Facets: [
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'PlacementInfoFacet',
      Label  : 'Placement Information',
      Target : '@UI.FieldGroup#PlacementInfo'
    }
  ]
);

// ============================================================================
// Value help — turn integer location_ID into a searchable dropdown
// ============================================================================

annotate service.Locations with {
  ID @Common.Text: name @Common.TextArrangement: #TextOnly;
};

annotate service.Placements with {
  location @Common.ValueList: {
    CollectionPath: 'Locations',
    Parameters: [
      {
        $Type             : 'Common.ValueListParameterInOut',
        LocalDataProperty : location_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type             : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      },
      {
        $Type             : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'type'
      }
    ]
  };
};

// ============================================================================
// moveTank action — parameter labels and value help on Location
// ============================================================================

annotate service.Tanks with actions {
  moveTank (
    location_ID @(
      Common.Label: 'Location',
      Common.ValueList: {
        CollectionPath: 'Locations',
        Parameters: [
          {
            $Type             : 'Common.ValueListParameterInOut',
            LocalDataProperty : location_ID,
            ValueListProperty : 'ID'
          },
          {
            $Type             : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'name'
          },
          {
            $Type             : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'type'
          }
        ]
      }
    ),
    fromDate @Common.Label: 'From Date',
    note     @Common.Label: 'Note'
  );
};
