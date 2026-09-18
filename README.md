# Supreme Empire Server v2

Render build: `npm install`

Render start: `npm start`

Includes the working account/character system, five-character limit, globally unique nicknames, persistent player/character data, detailed character-data retrieval, and persistence fields for vehicles, properties, inventory, pets, banks, factions, jobs, missions, events and statistics.

Main endpoints: `/`, `/health`, `/api/status`, `/api/config`, `/api/players`.

Character endpoints include account creation, character creation, selection, full-data retrieval, saving and position saving.

For production multiplayer, use persistent storage/database supported by the host. Local files can be lost when an instance is replaced.
