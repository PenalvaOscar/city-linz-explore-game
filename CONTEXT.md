# Zwergerl

A competitive discovery game for Linz. Every spot has one owner; you take it by standing where they stood and reproducing their photo. Seeded from Ars Electronica Festival 2026 data and hand-picked Linz landmarks.

## Language

### Places

**Spot**:
A physical place in Linz that can be owned. Defined by coordinates, a reference photo and the compass heading that photo was taken at.
_Avoid_: pin, point, POI, location (reserved for the festival dataset's `locations` table)

**Gem**:
A spot that exists only inside a time window, derived from a festival calendar slot. When the window closes it can never be claimed again.
_Avoid_: ephemeral spot, event, installation

**Window**:
The start and end time during which a gem is claimable.

**Reference photo**:
The photo a spot's current owner took when claiming it. Challengers reproduce it.
_Avoid_: origin photo, target image

**Heading**:
The compass bearing (0–360°) the reference photo was taken at.
_Avoid_: direction, orientation, bearing

### Play

**Player**:
A person using the app, identified by a device-local id and a display name. No account.
_Avoid_: user, account

**Claim**:
The act of standing at a spot and taking a photo that passes verification. A claim on a free spot makes you its owner; a claim on an owned spot is a steal.
_Avoid_: capture, check-in, visit

**Steal**:
A successful claim on a spot someone else owns. Ownership and points transfer.
_Avoid_: takeover, conquer

**Reclaim**:
A successful claim by the current owner on their own spot. Resets the decay timer. Requires a full claim, not just presence.

**Owner**:
The player whose claim on a spot is the most recent one still in force.

**Decay**:
Loss of ownership when the owner has not reclaimed for the decay period (14 days). A decayed spot is free. In this version decay is applied in the app from the holding's `held_since` (`applyDecay` in the verify module, once at the app root); the server row stays until the next passing claim overwrites it.
_Avoid_: grip, expiry

**Verification**:
The set of gates a claim must pass: GPS distance, GPS accuracy, compass heading, dwell time. All must pass independently; they are never blended into one score.

**Dwell**:
The minimum time a player must remain within range before the camera unlocks. Proves they stopped rather than passed by.

**Leaderboard**:
Ranking of players by the summed points of spots they currently own. Not lifetime points. Ties break by number of spots (more first), then by the earliest of each player's most recent `held_since` (whoever reached their standing first wins). Ranks are 1-based with no gaps (`rankPlayers` in the verify module, fed the same decayed holdings the map uses).
