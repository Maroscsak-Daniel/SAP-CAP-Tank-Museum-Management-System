const cds = require('@sap/cds')

const FAR_FUTURE = '9999-12-31'

function overlaps(aFrom, aTo, bFrom, bTo) {
  const A1 = aFrom
  const A2 = aTo || FAR_FUTURE
  const B1 = bFrom
  const B2 = bTo || FAR_FUTURE
  return A1 < B2 && B1 < A2
}

// Maps a Location.type (LocationKind) to the Tank.status that should
// apply while a tank's current placement is in that kind of location.
// Returns null when no automatic mapping exists — caller leaves status alone.
function statusForKind(kind) {
  switch (kind) {
    case 'HALL':     return 'ON_DISPLAY'
    case 'OUTDOOR':  return 'ON_DISPLAY'
    case 'WORKSHOP': return 'UNDER_RESTORATION'
    case 'STORAGE':  return 'IN_STORAGE'
    case 'OFFSITE':  return 'IN_STORAGE'
    default:         return null
  }
}

module.exports = cds.service.impl(async function () {
  const { Tanks, Locations, Placements } = this.entities

  this.before(['CREATE', 'UPDATE', 'PATCH'], Placements, async (req) => {
    const tx = cds.transaction(req)

    const placementId =
      req.data.ID ??
      req.params?.[0]?.ID ??
      req.subject?.ref?.at?.(-1)?.where?.find?.((x) => x.ref?.[0] === 'ID')?.val

    let tank_ID = req.data.tank_ID
    let location_ID = req.data.location_ID
    let fromDate = req.data.fromDate
    let toDate = req.data.toDate

    // For UPDATE/PATCH, missing fields may need to be read from existing row
    if (req.event === 'UPDATE' && placementId != null) {
      const existing = await tx.run(
        SELECT.one
          .from(Placements)
          .where({ ID: placementId })
          .columns('ID', 'tank_ID', 'location_ID', 'fromDate', 'toDate')
      )

      if (!existing) {
        return req.reject(404, `Placement ${placementId} not found`)
      }

      tank_ID = tank_ID ?? existing.tank_ID
      location_ID = location_ID ?? existing.location_ID
      fromDate = fromDate ?? existing.fromDate
      toDate = toDate ?? existing.toDate
    }

    if (tank_ID == null) {
      return req.reject(400, 'tank_ID is required')
    }

    if (location_ID == null) {
      return req.reject(400, 'location_ID is required')
    }

    if (!fromDate) {
      return req.reject(400, 'fromDate is required')
    }

    if (toDate && toDate < fromDate) {
      return req.reject(400, 'toDate cannot be earlier than fromDate')
    }

    const tank = await tx.run(
      SELECT.one.from(Tanks).where({ ID: tank_ID }).columns('ID')
    )
    if (!tank) {
      return req.reject(404, `Tank ${tank_ID} not found`)
    }

    const location = await tx.run(
      SELECT.one.from(Locations).where({ ID: location_ID }).columns('ID')
    )
    if (!location) {
      return req.reject(404, `Location ${location_ID} not found`)
    }

    const existingPlacements = await tx.run(
      SELECT.from(Placements)
        .where({ tank_ID })
        .columns('ID', 'fromDate', 'toDate', 'location_ID')
    )

    if (!toDate) {
      const open = await tx.run(
        SELECT.one.from(Placements)
          .where({ tank_ID, toDate: null })
          .columns('ID')
      )

      if (open && open.ID !== placementId) {
        return req.reject(400, `Tank ${tank_ID} already has an active placement`)
      }
    }

    for (const row of existingPlacements) {
      if (placementId != null && row.ID === placementId) continue

      if (overlaps(fromDate, toDate, row.fromDate, row.toDate)) {
        return req.reject(
          400,
          `Tank ${tank_ID} already has an overlapping placement (existing placement ID ${row.ID})`
        )
      }
    }
  })

  // Sync Tank.status when a new open-ended placement is created via plain CRUD,
  // so direct POST /Placements and moveTank stay consistent.
  this.after('CREATE', Placements, async (data, req) => {
    if (!data || data.toDate) return
    const tx = cds.transaction(req)
    const loc = await tx.run(
      SELECT.one.from(Locations).where({ ID: data.location_ID }).columns('type')
    )
    const newStatus = statusForKind(loc?.type)
    if (newStatus) {
      await tx.run(UPDATE(Tanks).set({ status: newStatus }).where({ ID: data.tank_ID }))
    }
  })

  // DELETE safety for Tanks
  this.before('DELETE', Tanks, async (req) => {
    const tx = cds.transaction(req)
    const id = req.params[0].ID

    const exists = await tx.run(
      SELECT.one.from(Placements).where({ tank_ID: id }).columns('ID')
    )

    if (exists) {
      return req.reject(400, `Cannot delete tank ${id} with existing placements`)
    }
  })

  // DELETE safety for Locations
  this.before('DELETE', Locations, async (req) => {
    const tx = cds.transaction(req)
    const id = req.params[0].ID

    const exists = await tx.run(
      SELECT.one.from(Placements).where({ location_ID: id }).columns('ID')
    )

    if (exists) {
      return req.reject(400, `Cannot delete location ${id} with existing placements`)
    }
  })


  // moveTank function implementation
  this.on('moveTank', async (req) => {
    const tx = cds.transaction(req)

    const tank_ID = req.params?.[0]?.ID
    const location_ID = req.data.location_ID ?? req.data.location?.ID
    const { fromDate, note } = req.data

    if (!tank_ID) return req.reject(400, 'Bound tank ID is required')
    if (!location_ID) return req.reject(400, 'location_ID is required')
    if (!fromDate) return req.reject(400, 'fromDate is required')

    const tank = await tx.run(
      SELECT.one.from(Tanks).where({ ID: tank_ID }).columns('ID')
    )
    if (!tank) return req.reject(404, `Tank ${tank_ID} not found`)

    const location = await tx.run(
      SELECT.one.from(Locations).where({ ID: location_ID }).columns('ID', 'type')
    )
    if (!location) return req.reject(404, `Location ${location_ID} not found`)

    const current = await tx.run(
      SELECT.one.from(Placements)
        .where({ tank_ID, toDate: null })
        .columns('ID', 'fromDate', 'location_ID')
    )

    if (current) {
      if (current.fromDate >= fromDate) {
        return req.reject(
          400,
          'New placement must start after current placement'
        )
      }

      if (current.location_ID === location_ID) {
        return req.reject(400, 'Tank is already in this location')
      }

      await tx.run(
        UPDATE(Placements)
          .set({ toDate: fromDate })
          .where({ ID: current.ID })
      )
    }

    await tx.run(
      INSERT.into(Placements).entries({
        tank_ID,
        location_ID,
        fromDate,
        toDate: null,
        note
      })
    )

    // Re-select instead of relying on lastInsertRowid (HANA-incompatible).
    const newPlacement = await tx.run(
      SELECT.one.from(Placements)
        .where({ tank_ID, location_ID, fromDate, toDate: null })
    )

    const newStatus = statusForKind(location.type)
    if (newStatus) {
      await tx.run(
        UPDATE(Tanks)
          .set({ status: newStatus })
          .where({ ID: tank_ID })
      )
    }

    return newPlacement
  })

  // Where tanks are now
  this.on('getCurrentPlacements', async (req) => {
    const tx = cds.transaction(req)

    return tx.run(
      SELECT.from(Placements)
        .where({ toDate: null })
        .columns(
          'ID',
          'fromDate',
          'toDate',
          'note',
          'tank_ID',
          'location_ID'
        )
    )
  })

  // How many tanks per location
  this.on('getLocationStats', async (req) => {
    const tx = cds.transaction(req)

    return tx.run(
      SELECT.from(Placements)
        .where({ toDate: null })
        .columns(
          'location_ID',
          'location.name as locationName',
          'count(*) as tankCount'
        )
        .groupBy('location_ID', 'location.name')
    )
  })
})
