const STORAGE_KEY = 'mnemosyne_accord_state';

const defaultState = {
  clearanceLevel: 1, // 1 to 5
  unlocked: {
    keplerIII: false,      // Unlocked via Aegis submission
    archiveAccess: false,  // Unlocked at Level 2+
    missionLog: false,
    crewRecords: false,
    jovianSystem: false
  },
  submissions: {
    aegisCompleted: false,
    directChannelCompleted: false
  },
  lastScene: null // e.g. 'kepler-iii/docking-port'
};

export const Progress = {
  get() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? { ...defaultState, ...JSON.parse(data) } : defaultState;
    } catch {
      return defaultState;
    }
  },

  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('accord:state-change', { detail: state }));
  },

  setLevel(level) {
    const state = this.get();
    state.clearanceLevel = Math.max(1, Math.min(5, level));
    if (state.clearanceLevel >= 2) {
      state.unlocked.archiveAccess = true;
    }
    this.save(state);
  },

  completeAegisSubmission() {
    const state = this.get();
    state.submissions.aegisCompleted = true;
    state.unlocked.keplerIII = true;
    this.save(state);
  },

  syncUI() {
    const state = this.get();

    // 1. Footer: Archive Access (greyed out until Level >= 2)
    const archiveBtn = document.querySelector('[data-nav="archive-access"]');
    if (archiveBtn) {
      const canAccess = state.clearanceLevel >= 2 || state.unlocked.archiveAccess;
      archiveBtn.classList.toggle('disabled', !canAccess);
      archiveBtn.setAttribute('aria-disabled', String(!canAccess));
      if (!canAccess) archiveBtn.removeAttribute('href');
    }

    // 2. Hub Button: Enter Kepler III (locked until Aegis submission)
    const keplerBtn = document.querySelector('[data-action="enter-kepler"]');
    if (keplerBtn) {
      keplerBtn.classList.toggle('disabled', !state.unlocked.keplerIII);
      keplerBtn.onclick = (e) => {
        if (!state.unlocked.keplerIII) {
          e.preventDefault();
          window.location.href = 'submit.html'; // Or modal/Aegis trigger
        }
      };
    }
  }
};

// Run automatically on load and cross-tab storage sync
window.addEventListener('DOMContentLoaded', () => Progress.syncUI());
window.addEventListener('storage', () => Progress.syncUI());