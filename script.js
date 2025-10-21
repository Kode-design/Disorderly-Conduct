const screens = {
  menu: document.getElementById('menuScreen'),
  customization: document.getElementById('customizationScreen'),
  tutorial: document.getElementById('tutorialScreen')
};

const buttons = {
  start: document.getElementById('startGameBtn'),
  credits: document.getElementById('viewCreditsBtn'),
  action: document.getElementById('actionBtn'),
  optional: document.getElementById('optionalBtn'),
  randomize: document.getElementById('randomizeBtn')
};

const panels = {
  credits: document.getElementById('creditsPanel'),
  objectives: document.getElementById('objectiveList'),
  storyLog: document.getElementById('storyLog'),
  accompliceName: document.getElementById('accompliceName'),
  accompliceMood: document.getElementById('accompliceMood'),
  heatBar: document.getElementById('heatLevel'),
  tutorialTitle: document.getElementById('tutorialTitle'),
  tutorialSubtitle: document.getElementById('tutorialSubtitle')
};

const previewEls = {
  alias: document.getElementById('previewAlias'),
  pronouns: document.getElementById('previewPronouns'),
  style: document.getElementById('previewStyle'),
  backstory: document.getElementById('previewBackstory'),
  avatarBody: document.querySelector('.avatar-body')
};

const form = document.getElementById('customizationForm');
const fields = {
  name: document.getElementById('playerName'),
  pronouns: document.getElementById('playerPronouns'),
  style: document.getElementById('playerStyle'),
  color: document.getElementById('accentColor'),
  backstory: document.getElementById('backstory')
};

const accompliceNames = [
  'Jax "Overdrive" Malloy',
  'Rhea "Bitflip" Calder',
  'Micah "Skids" Navarro',
  'Avery "Ghost" Tanaka',
  'Kato "Blink" Moreau',
  'Sable "Quickdraw" Vega',
  'Rook "Switchblade" Ortiz'
];

const styles = {
  street: 'Street Vanguard',
  sleek: 'Sleek Minimalist',
  punk: 'Neon Punk',
  retro: 'Retro Hustler'
};

const state = {
  playerName: '',
  pronouns: fields.pronouns.value,
  style: fields.style.value,
  color: fields.color.value,
  backstory: '',
  accomplice: '',
  heat: 12,
  currentStep: 0,
  currentAction: 0,
  tutorialComplete: false
};

const tutorialSteps = [
  {
    id: 'rendezvous',
    title: 'Rendezvous Outside the Midnight Express',
    subtitle: 'Nerves hum louder than the neon.',
    intro: (alias, accomplice) =>
      `${alias} meets ${accomplice} beside a flickering holo-sign. Rain-slick streets mirror the city glow as the plan clicks into place.`,
    objectiveId: 'meet-up',
    actions: [
      {
        label: 'Check the gear',
        logTitle: 'Loadout Check',
        logText: 'You pat down your jacket—mask, voice modulator, pocket jammer. Everything sits where it should. ${accomplice} nods, approving.',
        heat: 4
      },
      {
        label: 'Exchange the code phrase',
        logTitle: 'Signal Locked',
        logText: '“No sleep for Atlas,” you whisper. “Not tonight,” ${accomplice} smirks back. The plan is officially live.',
        heat: 3
      }
    ],
    optionalAction: {
      label: 'Ask about the getaway route',
      logTitle: 'Route Recap',
      logText: '${accomplice} taps a map on their holo-pad. “Two blocks east, stash car in the alley. If we split, you cut south.”',
      mood: 'focused'
    }
  },
  {
    id: 'scouting',
    title: 'Case the Convenience Store',
    subtitle: 'Every detail counts.',
    intro: (alias, accomplice) =>
      `${accomplice} keeps lookout while ${alias} studies the store. Flickers in the camera feed hint at exploitable blind spots.`,
    objectiveId: 'case-store',
    actions: [
      {
        label: 'Map the cameras',
        logTitle: 'Camera Sweep',
        logText: 'The corner cameras loop every twelve seconds. You set a silent ping on your wrist HUD to stay in sync.',
        heat: 6
      },
      {
        label: 'Time the door chime',
        logTitle: 'Sound Off',
        logText: 'You open the door a crack, counting the milliseconds before the chime cuts. With the jammer ready, you can ghost in unnoticed.',
        heat: 5
      }
    ],
    optionalAction: {
      label: 'Reassure your partner',
      logTitle: 'Confidence Boost',
      logText: '“We got this,” you tell ${accomplice}. They inhale, steel-eyed again. “Right. Let’s rewrite the night.”',
      mood: 'steady'
    }
  },
  {
    id: 'entry',
    title: 'Slip Inside',
    subtitle: 'No alarms. No witnesses.',
    intro: (alias) =>
      `${alias} triggers the pocket jammer. The door sighs open—silent, seamless. Refrigerated air and stale coffee hit hard.`,
    objectiveId: 'enter-store',
    actions: [
      {
        label: 'Lock the door behind you',
        logTitle: 'Secured Entrance',
        logText: 'You flip the bolt without a sound. Rain muffles the world outside. It’s just you, ${accomplice}, and the clerk.',
        heat: 8
      },
      {
        label: 'Make contact with the clerk',
        logTitle: 'Intimidation Tactic',
        logText: 'You raise your voice modulator. “Hands visible, easy now.” The clerk freezes, eyes wide, hands up.',
        heat: 10
      }
    ]
  },
  {
    id: 'register',
    title: 'Crack the Register',
    subtitle: 'Stay smooth under the neon glare.',
    intro: () =>
      'The register hums with stored credits. The clerk fumbles with the drawer while sweat beads on their brow.',
    objectiveId: 'hit-register',
    actions: [
      {
        label: 'Direct the clerk',
        logTitle: 'Command Presence',
        logText: '“No sudden moves.” The drawer pops. Bills, cred-chips, and lottery packs glint invitingly.',
        heat: 12
      },
      {
        label: 'Sweep the take',
        logTitle: 'Score Secured',
        logText: 'You empty the drawer into the duffel, prioritising cred-chips. ${accomplice} watches the security mirror for movement.',
        heat: 9
      }
    ],
    optionalAction: {
      label: 'Grab a mystery energy drink',
      logTitle: 'Impulse Purchase',
      logText: 'Because why not? You snag a glowing can labeled “Nebula Surge.” ${accomplice} raises an eyebrow but grins.',
      mood: 'amused'
    }
  },
  {
    id: 'escape',
    title: 'Make the Escape',
    subtitle: 'Heat rising. Time to run.',
    intro: (alias, accomplice) =>
      `${alias} signals ${accomplice}. You move in sync—aisles, door, alley. But the distant siren crescendos.`,
    objectiveId: 'escape',
    actions: [
      {
        label: 'Head for the alley',
        logTitle: 'Exit Strategy',
        logText: 'You dash through the rain, shoes splashing neon puddles. A siren wails louder—closer.',
        heat: 14
      },
      {
        label: 'Dive into cover',
        logTitle: 'Cornered',
        logText: 'A patrol car fishtails into the alley mouth. Headlights carve through the dark. There’s nowhere to run.',
        heat: 20
      }
    ]
  },
  {
    id: 'capture',
    title: 'The Bust',
    subtitle: 'Trust fractures under blue lights.',
    intro: (alias, accomplice) =>
      `Police flood the alley. ${accomplice} hesitates, then backs away. “Sorry, ${alias}. Survival first.”`,
    objectiveId: 'capture',
    actions: [
      {
        label: 'Drop the bag',
        logTitle: 'Hands Up',
        logText: 'Floodlights swallow you whole. You let the duffel fall, hands interlaced behind your head. Voices bark commands.',
        heat: 5
      },
      {
        label: 'Watch your partner vanish',
        logTitle: 'Left Behind',
        logText: '${accomplice} slips into the shadows, leaving you cuffed on the pavement. The sirens drown the betrayal.',
        heat: 0
      }
    ],
    finale: true
  }
];

buttons.start.addEventListener('click', () => {
  showScreen('customization');
  fields.name.focus();
});

buttons.credits.addEventListener('click', () => {
  panels.credits.hidden = !panels.credits.hidden;
  buttons.credits.textContent = panels.credits.hidden ? 'Credits' : 'Hide Credits';
});

buttons.randomize.addEventListener('click', () => {
  randomizeCharacter();
  updatePreview();
});

form.addEventListener('input', updatePreview);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    return;
  }

  state.playerName = fields.name.value.trim() || 'Unknown';
  state.pronouns = fields.pronouns.value;
  state.style = fields.style.value;
  state.color = fields.color.value;
  state.backstory = fields.backstory.value.trim();
  state.accomplice = generateAccompliceName();
  state.heat = 12;
  state.currentStep = 0;
  state.currentAction = 0;
  state.tutorialComplete = false;

  startTutorial();
});

buttons.action.addEventListener('click', () => {
  if (state.tutorialComplete) {
    resetToMenu();
    return;
  }

  handleAction();
});

buttons.optional.addEventListener('click', () => {
  const step = tutorialSteps[state.currentStep];
  if (!step || !step.optionalAction || step.optionalAction.completed) {
    return;
  }

  const optional = step.optionalAction;
  appendStory(optional.logTitle, templateText(optional.logText));
  updateAccompliceMood(optional.mood || 'steady');
  optional.completed = true;
  buttons.optional.hidden = true;
});

function showScreen(target) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('visible', key === target);
  });
}

function randomizeCharacter() {
  const randomAliases = ['Nova', 'Spitfire', 'Chrome', 'Cipher', 'Nova Blade', 'Riot', 'Echo'];
  const randomBackstories = [
    'Raised in the warehouses by contraband smugglers, you know every dockworker by name.',
    'Former street racer turned fixer after a betrayal in the Atlas Grand Prix.',
    'Ex-corporate analyst who siphoned funds and vanished into the undercity.',
    'Child of a legendary hustler—reputation is your inheritance, and your burden.'
  ];

  fields.name.value = randomAliases[Math.floor(Math.random() * randomAliases.length)];
  const pronounOptions = Array.from(fields.pronouns.options);
  fields.pronouns.value = pronounOptions[Math.floor(Math.random() * pronounOptions.length)].value;
  const styleOptions = Object.keys(styles);
  fields.style.value = styleOptions[Math.floor(Math.random() * styleOptions.length)];
  fields.color.value = `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
  fields.backstory.value = randomBackstories[Math.floor(Math.random() * randomBackstories.length)];
}

function updatePreview() {
  const alias = fields.name.value.trim() || '—';
  previewEls.alias.textContent = `Alias: ${alias}`;
  previewEls.pronouns.textContent = `Pronouns: ${fields.pronouns.value}`;
  previewEls.style.textContent = `Style: ${styles[fields.style.value]}`;
  previewEls.backstory.textContent = fields.backstory.value.trim()
    ? fields.backstory.value.trim()
    : 'Write a backstory to set the tone.';
  previewEls.avatarBody.style.background = fields.color.value;
}

function startTutorial() {
  showScreen('tutorial');
  panels.storyLog.innerHTML = '';
  panels.tutorialTitle.textContent = 'Tutorial: Robbery 101';
  panels.tutorialSubtitle.textContent = 'Midnight Express Convenience Store';
  updateAccompliceMood('calculating');
  panels.accompliceName.textContent = state.accomplice;

  populateObjectives();

  const step = tutorialSteps[state.currentStep];
  if (step) {
    appendStory(step.title, templateText(step.intro(state.playerName, state.accomplice)));
  }

  state.currentAction = 0;
  updateHeat(state.heat, true);
  refreshActionButtons();
}

function handleAction() {
  const step = tutorialSteps[state.currentStep];

  if (!step) {
    concludeTutorial();
    return;
  }

  const action = step.actions[state.currentAction];

  if (!action) {
    completeStep();
    return;
  }

  appendStory(action.logTitle, templateText(action.logText));
  updateHeat(action.heat);
  state.currentAction += 1;

  if (state.currentAction >= step.actions.length) {
    completeStep();
  } else {
    refreshActionButtons();
  }
}

function completeStep() {
  const step = tutorialSteps[state.currentStep];

  if (!step) {
    concludeTutorial();
    return;
  }

  markObjectiveComplete(step.objectiveId);
  updateAccompliceMood(step.finale ? 'distant' : 'wired');

  if (step.finale) {
    concludeTutorial();
    return;
  }

  state.currentStep += 1;
  state.currentAction = 0;
  const nextStep = tutorialSteps[state.currentStep];
  if (nextStep) {
    appendStory(nextStep.title, templateText(nextStep.intro(state.playerName, state.accomplice)));
  }
  refreshActionButtons();
}

function concludeTutorial() {
  if (state.tutorialComplete) {
    return;
  }

  appendStory('Tutorial Complete', `${state.playerName} is cuffed, loaded into the cruiser, and left to plot their next move. The city will hear from them again.`);
  panels.tutorialSubtitle.textContent = 'Booked and processed.';
  state.tutorialComplete = true;
  buttons.action.textContent = 'Return to Menu';
  buttons.optional.hidden = true;
}

function resetToMenu() {
  showScreen('menu');
  buttons.action.textContent = 'Continue';
  state.tutorialComplete = false;
  tutorialSteps.forEach((step) => {
    if (step.optionalAction) {
      step.optionalAction.completed = false;
    }
  });
  Array.from(panels.objectives.querySelectorAll('li')).forEach((li) => li.remove());
  panels.storyLog.innerHTML = '';
  panels.credits.hidden = true;
  buttons.credits.textContent = 'Credits';
}

function refreshActionButtons() {
  const step = tutorialSteps[state.currentStep];

  if (!step) {
    buttons.action.textContent = 'Continue';
    buttons.optional.hidden = true;
    return;
  }

  const action = step.actions[state.currentAction];
  buttons.action.textContent = action ? action.label : 'Continue';

  if (step.optionalAction && !step.optionalAction.completed) {
    buttons.optional.hidden = false;
    buttons.optional.textContent = step.optionalAction.label;
  } else {
    buttons.optional.hidden = true;
  }
}

function populateObjectives() {
  const objectives = [
    { id: 'meet-up', text: `Meet your accomplice ${state.accomplice} outside the Midnight Express.` },
    { id: 'case-store', text: 'Scout the store and identify surveillance blind spots.' },
    { id: 'enter-store', text: 'Enter the shop without triggering alarms.' },
    { id: 'hit-register', text: 'Control the clerk and empty the register.' },
    { id: 'escape', text: 'Escape through the alley before the cops arrive.' },
    { id: 'capture', text: 'Face the consequences when the heat catches up.' }
  ];

  panels.objectives.innerHTML = '';
  objectives.forEach((objective) => {
    const li = document.createElement('li');
    li.dataset.id = objective.id;
    li.textContent = objective.text;
    panels.objectives.appendChild(li);
  });
}

function markObjectiveComplete(id) {
  const li = panels.objectives.querySelector(`li[data-id="${id}"]`);
  if (li) {
    li.classList.add('completed');
  }
}

function appendStory(title, text) {
  const entry = document.createElement('article');
  entry.classList.add('story-entry');

  const heading = document.createElement('h4');
  heading.textContent = title;
  entry.appendChild(heading);

  const body = document.createElement('p');
  body.innerHTML = text;
  entry.appendChild(body);

  panels.storyLog.appendChild(entry);
  panels.storyLog.scrollTo({ top: panels.storyLog.scrollHeight, behavior: 'smooth' });
}

function updateHeat(amount, override = false) {
  if (override) {
    state.heat = amount;
  } else {
    state.heat = Math.min(100, state.heat + amount);
  }

  panels.heatBar.style.width = `${Math.min(100, state.heat)}%`;

  if (state.heat < 35) {
    panels.heatBar.style.background = 'linear-gradient(90deg, #47d7ac, #58e1c1)';
  } else if (state.heat < 70) {
    panels.heatBar.style.background = 'linear-gradient(90deg, #f5d547, #ff9f4f)';
  } else {
    panels.heatBar.style.background = 'linear-gradient(90deg, #ff4f5a, #a126b0)';
  }
}

function updateAccompliceMood(mood) {
  const moodDescriptions = {
    calculating: 'Mood: calculating',
    focused: 'Mood: focused',
    steady: 'Mood: steady',
    wired: 'Mood: wired',
    amused: 'Mood: amused',
    distant: 'Mood: distant'
  };

  panels.accompliceMood.textContent = moodDescriptions[mood] || `Mood: ${mood}`;
}

function templateText(text) {
  return text
    .replace(/\${alias}/g, state.playerName || 'You')
    .replace(/\${accomplice}/g, state.accomplice || 'your accomplice');
}

function generateAccompliceName() {
  return accompliceNames[Math.floor(Math.random() * accompliceNames.length)];
}

// Initialize preview state for first render
updatePreview();
