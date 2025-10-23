export const storyChapters = {
  'intro-gas-station': {
    id: 'intro-gas-station',
    title: 'Static Sparks',
    location: 'Waystone Gas &amp; Sip, Southside Megasprawl',
    beats: [
      {
        speaker: 'Nova',
        side: 'left',
        text: "Larry, you sure this joint still keeps hard wallets in the register? Thought everyone's riding cold storage drones now.",
      },
      {
        speaker: 'Larry',
        side: 'right',
        text: "Owner's old school. Station runs a ghost node for truckers. No aerial patrols, just one clerk and a sleepy defense turret.",
      },
      {
        speaker: 'Nova',
        side: 'left',
        text: "Ghost node means unreported Bc2. Perfect. We dash in, snag the drive, and you keep the engine purring.",
      },
      {
        speaker: 'Larry',
        side: 'right',
        text: "I'll be on comms. You get spooked, signal me and I'll kick off the distraction drones. Remember: stealth first, bullets if you must.",
      },
      {
        speaker: 'Nova',
        side: 'left',
        text: "2030 and we're still robbing gas stations. Let's make it cinematic.",
      },
    ],
    next: { scene: 'Game', missionId: 'gas-station' },
  },
  'after-gas-station': {
    id: 'after-gas-station',
    title: 'Wheel Smoke',
    location: 'Mobile Safehouse Van, Elevated Expressway',
    beats: [
      {
        speaker: 'Larry',
        side: 'right',
        text: "We fried half the precinct comms with that EMP charge. You feeling proud or terrified?",
      },
      {
        speaker: 'Nova',
        side: 'left',
        text: "Bc2 wallet decrypted. Sixty-eight thousand unregistered. Enough to move up the food chain.",
      },
      {
        speaker: 'Larry',
        side: 'right',
        text: "Heard of a crew hitting Hyperion's courier drones. They call themselves the Orion Ring. You want in?",
      },
      {
        speaker: 'Nova',
        side: 'left',
        text: "Let's see if they can keep up. Set course for the Neon Lot. I want to see what their fixer offers.",
      },
    ],
    next: { scene: 'Game', missionId: 'neon-lot' },
  },
  'after-neon-lot': {
    id: 'after-neon-lot',
    title: 'Ring of Trust',
    location: 'Abandoned MagRail Station',
    beats: [
      {
        speaker: 'Fixer Sera',
        side: 'right',
        text: "Welcome to the Orion Ring. Your stunt at Waystone lit up the feeds. We need a ghost who can shoot and sneak.",
      },
      {
        speaker: 'Nova',
        side: 'left',
        text: "State the job and the cut.",
      },
      {
        speaker: 'Fixer Sera',
        side: 'right',
        text: "Hyperion Vault Annex. Level 63. They store reserve bitcoin-II ledgers there. You get us the decryption qubit, and we rewrite their empire.",
      },
      {
        speaker: 'Larry',
        side: 'right',
        text: "Sounds suicidal. But I like the view from the top.",
      },
    ],
    next: { scene: 'Game', missionId: 'hyperion-annex' },
  },
  'after-hyperion-annex': {
    id: 'after-hyperion-annex',
    title: 'Fallout Protocols',
    location: 'Subterranean Safehouse, Old City',
    beats: [
      {
        speaker: 'Nova',
        side: 'left',
        text: "We tripped a hyperion panic beacon. They'll be swarming the district.",
      },
      {
        speaker: 'Larry',
        side: 'right',
        text: "We got the qubit though. It's chirping like a neon canary.",
      },
      {
        speaker: 'Fixer Sera',
        side: 'right',
        text: "Two options: Sell the qubit, live fat and fast. Or expose Hyperion's laundering to the Mesh, start a syndicate war. Decide fast.",
      },
    ],
    next: { scene: 'Game', missionId: 'finale-breakout' },
  },
  epilogue: {
    id: 'epilogue',
    title: 'Disorderly Dawn',
    location: 'Holo-Projection of the City Grid',
    beats: [
      {
        speaker: 'Nova',
        side: 'left',
        text: "No more small-time hits. We write the rules now.",
      },
      {
        speaker: 'Larry',
        side: 'right',
        text: "The city's either going to crown us or crush us. Either way, we get headlines.",
      },
      {
        speaker: 'Fixer Sera',
        side: 'right',
        text: "Welcome to the Ring's command board. Pick your targets. The night's still young.",
      },
    ],
    next: { scene: 'MainMenu', missionId: null },
  },
};

export const missions = [
  {
    id: 'gas-station',
    name: 'Ghost Pump Robbery',
    description:
      'Slip into Waystone Gas &amp; Sip, steal the cold wallet, and escape before corporate drones arrive.',
    mapId: 'gas-station',
    introChapter: 'intro-gas-station',
    outroChapter: 'after-gas-station',
    objectives: [
      'Infiltrate the gas station without triggering the alarm.',
      'Hack the ghost node terminal to locate the cold wallet.',
      "Loot the bitcoin-II wallet from the clerk's safe.",
      "Escape to Larry's car.",
    ],
    rewards: {
      wallet: 68000,
      codexUnlocks: ['waystone'],
    },
  },
  {
    id: 'neon-lot',
    name: 'Neon Lot Recon',
    description:
      'Meet the Orion Ring at a neon-drenched parking bazaar, fend off raiders, and earn their trust.',
    mapId: 'neon-lot',
    introChapter: 'after-gas-station',
    outroChapter: 'after-neon-lot',
    objectives: [
      'Locate Fixer Sera at the lot.',
      'Protect the Orion convoy from the Redline Gang.',
      'Secure the convoy drones and gather intel.',
    ],
    rewards: {
      wallet: 15000,
      codexUnlocks: ['orion-ring', 'redline-gang'],
    },
  },
  {
    id: 'hyperion-annex',
    name: 'Vault Annex Raid',
    description:
      "Penetrate Hyperion's annex, bypass stealth turrets, and steal the decryption qubit.",
    mapId: 'hyperion-annex',
    introChapter: 'after-neon-lot',
    outroChapter: 'after-hyperion-annex',
    objectives: [
      'Disable the surveillance grid via terminal hacking.',
      'Retrieve the qubit from the data vault.',
      'Exfiltrate to the service elevator with Larry.',
    ],
    rewards: {
      wallet: 85000,
      codexUnlocks: ['hyperion'],
    },
  },
  {
    id: 'finale-breakout',
    name: 'Breakout Broadcast',
    description:
      'Decide the fate of the qubit while Hyperion strike teams close in on your safehouse.',
    mapId: 'safehouse-siege',
    introChapter: 'after-hyperion-annex',
    outroChapter: 'epilogue',
    objectives: [
      'Defend the safehouse generators to keep power online.',
      'Hold the line with Larry while Sera deploys the broadcast.',
      'Choose to sell the qubit or leak the data.',
    ],
    rewards: {
      wallet: 120000,
      codexUnlocks: ['broadcast'],
    },
  },
];

export const codexEntries = {
  protagonist: {
    id: 'protagonist',
    title: 'Nova (Custom Protagonist)',
    body: `The protagonist is a self-made synth-runner forged by the megasprawl. Players can tailor Nova's background, skillset, and perks to influence stealth efficiency, weapon handling, and social standing with contacts.`,
  },
  waystone: {
    id: 'waystone',
    title: 'Waystone Gas &amp; Sip',
    body: `A forgotten station nestled beneath the elevated interstates. Waystone launders Bc2 for long-haul truckers who prefer analog anonymity over corporate ledgers.`,
  },
  'orion-ring': {
    id: 'orion-ring',
    title: 'The Orion Ring',
    body: `A decentralized heist collective specializing in data hijacks and precision raids. They recruit freelancers who can handle chaos without asking questions.`,
  },
  'redline-gang': {
    id: 'redline-gang',
    title: 'Redline Gang',
    body: `Mutated street-racers who retrofit junker cars with militia hardware. They crash Neon Lot meets to steal drone parts for their armored rigs.`,
  },
  hyperion: {
    id: 'hyperion',
    title: 'Hyperion Financial',
    body: `One of the big four megacorps controlling bitcoin-II flows. Their annex vaults are layered with AI wardens, but their greed outpaces their caution.`,
  },
  broadcast: {
    id: 'broadcast',
    title: 'Liberation Broadcast',
    body: `A pirate transmission protocol that can leak corporate ledgers directly onto the public Mesh. When synced with Hyperion's qubit, it could ignite citywide revolt.`,
  },
};
