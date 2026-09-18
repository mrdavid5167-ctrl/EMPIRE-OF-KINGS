# Supreme Empire Server

Supreme Empire is an online 3D mobile roleplay game. This repository documents and organizes the multiplayer server/backend that supports the Godot client.

> **Status:** Server architecture and gameplay specification  
> **Client:** Godot 4.x  
> **Target:** Android-first online multiplayer  
> **Deployment target:** OneBit  
> **Server URL:** `https://shycherry-29301.app.onebit.ng`

---

## 1. Server Responsibilities

The server is authoritative for all important gameplay state.

The server handles:

- Player accounts and characters
- Permanent Player IDs
- Authentication
- Multiplayer sessions
- Player positions and gameplay state
- Money and transactions
- Banks and account numbers
- Inventory
- Vehicles
- Properties
- Businesses
- Factions and ranks
- HR systems
- Crime wars
- Jobs and EXP
- Missions
- Game Center events
- Event rewards
- Pets
- Phone/SIM data
- Licenses
- Police/prison systems
- Hospital/death/respawn systems
- Admin permissions and actions
- Support tickets
- Media and advertisements
- Organization warehouses
- Green-zone rules
- Automatic activity logging and saving

The Godot client is responsible for presentation and controls, including the 3D world, characters, UI, animations, touch controls and visual effects.

---

# 2. Core Account System

## Supreme Empire Account

One Google account corresponds to one Supreme Empire account.

A player can have up to **5 characters**.

Each character has:

- Unique permanent Player ID
- Nickname
- Level
- EXP
- Money
- Inventory
- Vehicles
- Properties
- Businesses
- Faction membership
- Job progression
- Pets
- Phone/SIM
- Licenses
- Statistics
- Saved gameplay state

Player IDs begin at **1** and are never reused.

Reinstalling the game or changing phones must not erase the player's server-side progress.

---

# 3. Automatic Saving and Activity Tracking

The server saves gameplay state continuously.

The system is not limited to important actions.

Tracked activity can include:

- Movement/location checkpoints
- Walking/running
- Driving/flying
- Vehicle fuel and damage
- Entering/exiting buildings
- Item pickup/drop/use
- Purchases and sales
- Money transfers
- Jobs and work
- EXP and level changes
- Missions
- Faction activity
- Chat/action events where applicable
- Combat and death
- Hospital healing
- Respawning
- Properties
- Businesses
- Phone/SIM activity
- Pets
- Police/prison activity
- Admin actions
- Connect/disconnect
- Other gameplay state changes

Very frequent data such as movement is checkpointed/batched so the database is not overloaded while still protecting the latest valid state.

The system uses:

1. Event-driven saves
2. Periodic checkpoints
3. Automatic backups
4. Server-side validation

The server is the source of truth.

---

# 4. Player List

Command:

`/players`

Shows:

- Online player count
- Player ID
- Level
- Nickname

Example:

```text
ONLINE PLAYERS

ID    LEVEL    NICKNAME
1     12       PlayerOne
7     24       ShadowX
15    8        DavidRP
23    31       NightWolf
```

Admins can select a player and access authorized management actions.

---

# 5. Banks

Supreme Empire contains **4 fictional banks**, each with its own name, branding and physical location.

Players can:

- Open an account
- Receive a unique account number
- Deposit money
- Withdraw money
- Send money to another account number
- Receive transfers
- View transaction history
- Access banking through the phone
- Use physical bank locations

All balances and transfers are validated by the server.

### Four Banks

The final fictional names can be configured in the server bank configuration.

Example configuration structure:

```text
Bank 1
Bank 2
Bank 3
Bank 4
```

Each bank must have a unique internal ID and display name.

---

# 6. Game Center

The Game Center is a physical 3D location in the city.

Activities include:

- 🏎️ Racing
- 🏃 Time trials
- 🏀 Basketball challenges
- ⚽ Football challenges
- 🎯 Skill/target challenges
- 🏁 Obstacle courses
- 🧩 Puzzle challenges
- 🥇 Seasonal tournaments

Players can view:

- Current events
- Upcoming events
- Registration
- Entry requirements
- Countdown
- Leaderboards
- Personal best scores/times
- Event history
- Rewards

## Hourly Events

Each event has its own scheduled time and repeats every hour according to the server event schedule.

Five minutes before an event starts, the server automatically sends a global announcement to everyone online.

Example:

```text
📢 GAME CENTER:
Racing starts in 5 minutes!
Head to the Game Center to register.
```

The server controls the event clock.

## Rewards

The server determines final results.

Rewards are awarded to:

- 1st place
- 2nd place
- 3rd place

Rewards can consist of configured combinations of:

- Normal in-game money
- SE Coins
- EXP
- Guaranteed items
- Guaranteed cosmetics

Rewards are not gambling mechanics.

All participation, scores, results and rewards are automatically saved.

---

# 7. Missions

Missions are optional.

A player does **not** need to complete missions to live a complete Supreme Empire life.

Players can instead:

- Work jobs
- Run businesses
- Own properties
- Join factions
- Drive vehicles
- Participate in Game Center events
- Explore the city
- Socialize
- Manage finances
- Roleplay normally

Missions may provide configured rewards such as:

- Money
- EXP
- Items
- Other guaranteed rewards

Mission completion is saved automatically.

---

# 8. Factions and Organizations

Government and crime organizations include:

- Army
- Police
- FSB
- MIA
- Hospital
- Media
- Government
- Black Vipers
- Red Kings
- Shadow Syndicate
- Iron Wolves
- Night Owls
- Golden Skulls

Additional factions can be added later.

Each organization has its own:

- HQ
- Warehouse
- Members
- Ranks
- HR system
- Chat
- Activity records
- Permissions

---

# 9. Faction Rank and HR System

Each faction has:

- HR office
- AI/AFK HR worker
- Fixed recruitment questions
- Membership applications
- Promotion system
- Demotion system
- Activity history

HR commands:

```text
/hropen
/hrclose
/hrstatus
```

The recruitment test contains 8 fixed questions.

Passing requires at least:

```text
5/8
```

A result of:

```text
4/8 or lower
```

fails the application.

For crime factions:

- Rank 10 — Leader
- Rank 9 — Deputy
- Rank 8 — Trusted Member
- Lower ranks — regular members

Leadership permissions are server validated.

---

# 10. Crime Organizations

The six crime organizations are:

1. Black Vipers
2. Red Kings
3. Shadow Syndicate
4. Iron Wolves
5. Night Owls
6. Golden Skulls

They can participate in faction wars.

---

# 11. Crime Wars

Command:

`/war`

A crime organization can select another crime organization and an available war location.

War locations:

- Ironworks District
- Blackwater Docks
- Old Town Yard

Duration:

**15 minutes / 900 seconds**

Scoring:

- Each active player in the war zone contributes 1 point per second.
- Killing an opposing player transfers that player's accumulated points to the killer's faction and resets the victim's transferred score.
- The server validates zone membership and opposing-faction status.

Rewards:

- Winning participating players: `$25,000`
- Losing participating players: `$5,000`
- Nonparticipants: `$0`

Green zones cannot be used for faction combat.

---

# 12. Organization Warehouses

Every organization has a warehouse.

Warehouses exist for:

- Army
- Police
- FSB
- MIA
- Hospital
- Media
- Government
- All six crime organizations
- Future organizations

Warehouses can store approved fictional in-game organization equipment.

The server records:

- Deposits
- Withdrawals
- Member
- Timestamp
- Item
- Quantity
- Permissions

Leaders can view inventory, capacity and logs.

---

# 13. Admin System

Hierarchy:

1. Owner
2. Chief Admin
3. Admin
4. Moderator

The Owner and authorized Chief Admins can assign administrative roles.

Commands include:

```text
/giveadmin [Player ID] [level]
/removeadmin [Player ID]
/admininfo [Player ID]
/admins
```

Player management:

```text
/stats [ID]
/tp [ID]
/gethere [ID]
/kick [ID]
/ban [ID]
/unban [ID]
/mute [ID]
/unmute [ID]
/warn [ID]
/freeze [ID]
/unfreeze [ID]
/respawn [ID]
```

Vehicle administration:

```text
/spawncar [vehicle]
/respawncar [vehicle]
/getcar [vehicle]
/tpcar [vehicle]
```

Location:

```text
/goto [location]
```

Admin communication:

```text
/adminchat
/announce [message]
/reports
/tickets
```

Admin UI buttons must also be available in the Godot client.

Every admin action is validated and logged server-side.

---

# 14. Give Leadership

Authorized Owner/Chief Admin users can:

1. Select a player
2. Select a faction
3. Select a rank
4. Confirm

The server saves:

- Faction
- Rank
- Player ID
- Admin who made the change
- Timestamp

---

# 15. Government House

Government House is a 3D city landmark containing:

- Main hall
- Offices
- Leadership
- HR
- Recruitment
- Records
- Finance/admin
- Treasury
- Warehouse
- Documents
- Security/checkpoint
- Garage
- Press/conference room
- GPS marker

---

# 16. Licenses

Commands:

```text
/givelicense [ID]
/revokelicense [ID]
/renewlicense [ID]
/license [ID]
/licenses
```

License prices:

| License/service | Price |
|---|---:|
| Driving School Registration | $1,000 |
| Driving Test | $2,500 |
| Driving License | $5,000 |
| Motorcycle License | $3,500 |
| Commercial License | $10,000 |
| Heavy Vehicle License | $15,000 |
| Business License | $10,000 |
| Replacement | $2,500 |
| Renewal | $5,000 |

---

# 17. Vehicles

Vehicles have server-side:

- Ownership
- Fuel
- Health
- Location
- Lock state
- Engine state
- Damage
- Inventory where applicable

Normal vehicles do not automatically refill fuel or repair themselves.

Vehicle controls:

- Steering
- Accelerator
- Brake/reverse
- Handbrake
- Exit
- Horn
- Lights

---

# 18. Faction Vehicles and Helicopters

Non-crime factions can have faction helicopters.

Helicopter access requires:

**Rank 5+**

Crime organizations do not receive faction helicopters.

Faction hubs provide:

```text
🚗 CAR
🚁 HELICOPTER
```

Loading an eligible faction vehicle from the faction hub restores:

- 100% fuel
- 100% health

Helicopter controls include:

- Ascend
- Descend
- Forward
- Back
- Turn left/right
- Hover
- Exit

---

# 19. Scooter Rental

Scooter rental stations exist around the city.

Rental price:

**$50 per scooter**

The server validates payment and prevents duplication or unlimited unauthorized spawning.

---

# 20. Jobs and EXP

Side jobs have the following rewards:

| Job level | Reward |
|---|---:|
| Level 1 | $2,500 |
| Level 2 | $3,000 |
| Level 3 | $3,500 |
| Level 4 | $4,000 |
| Level 5 | $5,000 |
| Level 6 | $6,000 |
| Level 7 | $7,000 |
| Level 8+ | $8,000 |

Jobs include:

- Taxi
- Delivery
- Bus
- Garbage
- Mechanic
- Courier
- Medical
- Government
- Other configured jobs

Active play awards:

**100 EXP per active hour**

The server tracks active time and prevents simple client-side clock manipulation.

---

# 21. Properties

Players can own:

- Houses
- Estates
- Garages
- Businesses

Minimum house price:

**$75,000**

Except for the cheapest house, houses include garages.

House numbers are unique.

GPS command:

```text
/ghouse 027
```

Players can:

- Buy
- Upgrade
- Lock
- Sell
- Rent
- Enter
- Exit

Buildings use physical 3D entrances and exits.

---

# 22. Businesses

Business prices include:

| Business | Price |
|---|---:|
| Small 24/7 | $300,000 |
| Small Restaurant | $400,000 |
| Small Clothing | $500,000 |
| Small Mechanic | $600,000 |
| Large 24/7 | $800,000 |
| Large Restaurant | $1,000,000 |
| Premium Clothing | $1,250,000 |
| Large Mechanic | $1,500,000 |
| Gas Station | $2,000,000 |
| Car Dealership | $3,000,000 |
| Entertainment Venue | $4,000,000 |
| Premium Dealership | $6,000,000 |
| Major Commercial Building | $10,000,000 |

Business owners can manage:

- Employees
- Prices
- Revenue
- Inventory where applicable
- Business information

Commands:

```text
/business
/bizinfo
/employees
/hire
/fire
```

---

# 23. Hospital and Death System

If a player dies:

1. The server validates the death.
2. The death is recorded.
3. The player automatically respawns at a hospital.
4. The new state is saved.

Hospital contains:

- Healing spot
- Medical worker NPC
- Medical Card Desk
- Emergency area
- Ambulance area
- Death respawn point

Healing is server validated.

Army members have a separate Army Hospital with:

- Army medical staff
- Medical-card services
- Military ambulance
- Supplies
- Duty areas
- Restricted areas
- GPS marker

---

# 24. Green Zones

Green zones are protected public areas.

Inside a green zone:

- No shooting
- No player damage
- No player killing
- No combat scoring
- Pet combat disabled

Health and armor cannot be damaged by combat there.

Supreme Empire Park is a signature green-zone landmark.

---

# 25. Pets

Players can own unlimited pets but only have **1 active pet** at a time.

Pets:

- Follow
- Stay
- Come
- Sit
- Defend
- Go home
- Show statistics

Commands:

```text
/pet
/pet follow
/pet stay
/pet come
/pet sit
/pet defend
/pet home
/pet stats
```

The owner chooses the pet's name.

There are **no pet IDs**.

Renaming is available at the physical Pet Shop only.

Pets:

- Regenerate
- Cannot permanently die
- Can defend their owner only after the owner is attacked
- Cannot fight in green zones
- Are server validated

---

# 26. Phone and SIM

Phone features:

- Contacts
- Calls
- SMS
- Player contacts
- GPS
- Bank
- Money/account
- Vehicle
- Properties
- Jobs
- Businesses
- Missions
- Stats
- Inventory
- Notifications
- Settings
- Support
- Pets
- Documents

There is no phone battery/charger gameplay item.

Prices:

| Item | Price |
|---|---:|
| Basic Phone | $5,000 |
| Premium Phone | $25,000 |
| Luxury Phone | $75,000 |
| SIM | $1,000 |
| Replacement | $2,000 |
| New Number | $5,000 |

Phone numbers are unique.

---

# 27. Chat

Supported roleplay chat:

```text
/me
/do
/try
/todo
/hi
/s
/w
/b
```

Systems include:

- Local chat
- Shout
- Whisper
- OOC
- Faction chat
- Radio
- Private messages
- Helper/admin chat

There are **no unsent-message entries** in the messaging system. Only actually sent messages are displayed/saved.

---

# 28. Support System

Phone → Support contains:

- Ask a Helper
- Call an Admin
- Report a Player
- Report a Bug
- Appeal

Tickets contain:

- Ticket number
- Player ID
- Question/report
- Status
- Replies
- Close state

---

# 29. Media System

Media organizations can manage:

- News
- Broadcasts
- Interviews
- Advertisements

Command:

```text
/edit
```

The edit interface shows:

- Original message
- Rewrite box
- REJECT
- ACCEPT

When accepted, the rewritten version is published.

Advertisements can be submitted by businesses/players using in-game money.

Media reviews advertisements before publication.

---

# 30. Interaction System

Players can interact with nearby players through an interaction button.

Available information/actions can include:

- Profile
- ID card
- Licenses
- Medical card
- Job/faction information
- Vehicle information
- Request documents
- Greet
- Private interaction/message
- Report

Consent-based non-sexual interactions:

```text
/hug [ID]
/kiss [ID]
```

These require proximity and acceptance where applicable.

Other non-sexual roleplay actions:

```text
/rest
/cuddle
/sleep
```

---

# 31. Marriage and Wedding Hall

The game includes a dedicated 3D Wedding Hall.

Features include:

- Proposal accept/decline
- Ring
- Flowers
- Wedding decorations
- Outfits
- Ceremony
- Guests
- Music
- Photos
- Marriage certificate
- Married status
- Optional shared-house permissions
- Gifts
- Government divorce process

---

# 32. Shops

The city includes physical shops and interactive 3D locations.

Examples:

- 24/7 item stores
- Clothing stores
- Accessory stores
- Pet Shop
- Car dealerships
- Mechanic
- Fuel stations
- Restaurants
- Bars
- Clubs
- Other approved businesses

Clothing stores use physical displays/mannequins.

Players walk to an outfit, preview it, view its price and buy or leave.

---

# 33. Character Skins

At first character creation, players choose from **3 predefined character skins**.

There is no free-form face/body/appearance editor.

Skin tone can be selected/configured as allowed by the character system.

Additional original/random skins can be added using internal Skin IDs.

Recognizable real-person likenesses, real manufacturer branding, and other protected designs require appropriate licensing for commercial use. Otherwise the game should use original designs.

---

# 34. Map and GPS

The 3D city includes:

- Roads
- Districts
- Houses
- Apartments
- Businesses
- Garages
- Dealerships
- Mechanics
- Fuel stations
- Banks
- Hospitals
- Police
- Fire
- 24/7 stores
- Clothing
- Restaurants
- Bars/clubs
- Faction HQs
- Prison
- Jobs
- Missions
- Properties
- War locations
- Green zones
- Game Center
- Wedding Hall

GPS commands:

```text
/gps
/ghouse
/gpscar
/waypoint
/route
/cancelroute
```

A permanent minimap is available.

---

# 35. Normal Player Commands

```text
/help
/me
/do
/try
/todo
/time
/stats
/inventory
/items
/report
/admins
/b
/s
/w
/hi
/hug
/kiss
/rest
/cuddle
/sleep
```

---

# 36. Vehicle Commands

```text
/car
/engine
/lock
/trunk
/hood
/lights
/park
/gpscar
```

---

# 37. Property Commands

```text
/house
/lockhouse
/sellhouse
/rent
/buyhouse
```

---

# 38. Money Commands

```text
/pay
/give
/inventory
/stats
```

---

# 39. Police Commands

```text
/duty
/arrest
/cuff
/uncuff
/frisk
/wanted
/charges
/jail
/ticket
/backup
/radio
```

---

# 40. Prison Commands

```text
/sentence
/prisoninfo
/prisoners
/release
```

---

# 41. Media Commands

```text
/ad
/ads
/myads
/cancelad
/adlist
/edit
/news
/broadcast
/interview
/media
```

---

# 42. Faction Commands

```text
/faction
/members
/invite
/uninvite
/promote
/demote
/factioninfo
/factionchat
/war
```

---

# 43. Server Security

All important actions must be validated server-side.

The client must not be trusted to decide:

- Money balances
- Item ownership
- Vehicle ownership
- Faction rank
- Admin permissions
- War scores
- Event results
- Rewards
- EXP
- Health
- Fuel
- Licenses
- Property ownership
- Business ownership
- Pet ownership
- Player IDs

The server must reject invalid or unauthorized requests.

---

# 44. Suggested Project Structure

```text
The-supreme-empire-server/
│
├── server.js
├── package.json
├── README.md
│
├── config/
│   ├── banks.json
│   ├── factions.json
│   ├── jobs.json
│   ├── events.json
│   ├── licenses.json
│   ├── vehicles.json
│   ├── businesses.json
│   ├── properties.json
│   └── pets.json
│
├── database/
│   ├── connection.js
│   ├── schema/
│   └── migrations/
│
├── players/
│   ├── playerService.js
│   ├── characterService.js
│   └── playerRepository.js
│
├── vehicles/
│   ├── vehicleService.js
│   └── vehicleRepository.js
│
├── factions/
│   ├── factionService.js
│   ├── hrService.js
│   └── warService.js
│
├── properties/
│   └── propertyService.js
│
├── businesses/
│   └── businessService.js
│
├── missions/
│   └── missionService.js
│
├── inventory/
│   └── inventoryService.js
│
├── phone/
│   └── phoneService.js
│
├── banks/
│   └── bankService.js
│
├── events/
│   └── gameCenterService.js
│
├── pets/
│   └── petService.js
│
├── admin/
│   └── adminService.js
│
├── support/
│   └── supportService.js
│
├── logs/
│   └── activityLogger.js
│
└── backups/
```

The exact implementation may use additional files as required.

**Important:** every imported/required file must exist in the deployed repository. For example, if `server.js` requires:

```text
./config/banks.json
```

then that file must actually be present in the GitHub repository and deployment package.

---

# 45. OneBit Deployment

The deployment target is OneBit.

The repository must contain:

- `package.json`
- Server entry point
- All imported modules
- All configuration files
- Database configuration
- Required environment configuration
- No missing required files

The Node.js process must listen on the port supplied by the hosting platform:

```text
process.env.PORT
```

The server should bind to the appropriate public interface rather than only `localhost`.

Before deployment:

1. Install dependencies.
2. Start the server locally/in a test environment.
3. Verify every import.
4. Verify configuration files.
5. Verify startup.
6. Verify health/status endpoint.
7. Verify WebSocket/multiplayer connection.
8. Only then deploy to OneBit.

---

# 46. Environment Variables

Secrets must not be hard-coded into the repository.

Possible environment variables include:

```text
PORT
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SESSION_SECRET
JWT_SECRET
```

Only variables actually required by the implementation should be configured.

---

# 47. Godot Client Connection

The Godot client connects to the deployed server using the configured public endpoint.

Current OneBit public endpoint:

```text
https://shycherry-29301.app.onebit.ng
```

The actual multiplayer transport endpoint must match the backend implementation and OneBit's exposed networking configuration.

The internal deployment address:

```text
deploy-app-293011ad-162d-4f51-8472-9982a7c7837f:31235
```

must **not** be used by public players unless OneBit explicitly documents it as a public endpoint.

---

# 48. Resource Architecture

The game client can use separate resource packages while loading them as one game.

Suggested structure:

```text
SupremeEmpire/
├── Game/
│   ├── project.godot
│   ├── scenes/
│   ├── scripts/
│   ├── UI/
│   └── assets/
│
├── Resources/
│   ├── 01_Core/
│   ├── 02_City/
│   ├── 03_Buildings/
│   ├── 04_Characters/
│   ├── 05_Vehicles/
│   ├── 06_Pets/
│   ├── 07_Animations/
│   └── 08_Audio/
│
├── Server/
└── Config/
    └── resource_manifest.json
```

Target total game resource size is approximately **2.4 GB**, subject to optimization and final assets.

---

# 49. Development Principles

Supreme Empire should follow these principles:

- Server-authoritative multiplayer
- Persistent player progression
- Automatic activity saving
- Secure transactions
- Validated permissions
- Mobile-friendly controls
- Modular backend
- Expandable factions
- Expandable businesses
- Expandable events
- Optional missions
- No forced mission progression
- No gambling mechanics
- Clear logs
- Reliable backups
- No missing imports or configuration files

---

# 50. Development Checklist

Before calling the server deployment complete:

- [ ] `server.js` starts successfully
- [ ] `package.json` contains a valid start script
- [ ] All imports resolve
- [ ] `config/banks.json` exists
- [ ] All configuration files exist
- [ ] Database initializes successfully
- [ ] Health endpoint responds
- [ ] Public endpoint responds
- [ ] Multiplayer connection works
- [ ] Account creation works
- [ ] Character creation works
- [ ] Player IDs are permanent
- [ ] `/players` works
- [ ] Saving works
- [ ] Banking works
- [ ] Transfers work
- [ ] Game Center events work
- [ ] Five-minute announcements work
- [ ] Rewards work
- [ ] Missions remain optional
- [ ] Factions work
- [ ] HR works
- [ ] Admin permissions work
- [ ] Vehicles work
- [ ] Properties work
- [ ] Businesses work
- [ ] Jobs/EXP work
- [ ] Hospital/respawn works
- [ ] Pets work
- [ ] Phone works
- [ ] Support works
- [ ] Logs work
- [ ] Backups work

---

## Supreme Empire

**One world. Persistent characters. Online roleplay.**

The backend exists to keep the world synchronized, secure, persistent and ready for the Godot mobile client.
