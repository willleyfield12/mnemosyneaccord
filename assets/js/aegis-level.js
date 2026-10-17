(function () {
  // Canonical Twelve Halls matching oblivian/hall-<id>.html & sigils
  const hallIds = [
    'wakingdreams',      // Hall I
    'dividedmirror',     // Hall II
    'answeringworld',    // Hall III
    'livingaxis',        // Hall IV
    'returningvoice',    // Hall V
    'openmind',          // Hall VI
    'sharedheart',       // Hall VII
    'livingscripture',   // Hall VIII
    'unbrokenseed',      // Hall IX
    'rememberedhours',   // Hall X
    'secondform',        // Hall XI
    'enduringself'       // Hall XII
  ];

  const greaterHallIds = [
    'wakingdreams',
    'dividedmirror',
    'answeringworld',
    'livingaxis'
  ];

  function isComplete(id) {
    return localStorage.getItem(`hall_${id}`) === 'complete';
  }

  function completedCount() {
    return hallIds.filter(isComplete).length;
  }

  function greaterCompletedCount() {
    return greaterHallIds.filter(isComplete).length;
  }

  function getAegisLevel() {
    const totalDone = completedCount();
    const greaterDone = greaterCompletedCount();

    // Level progression
    if (totalDone >= 12) return 3; // Full Accord restored
    if (totalDone >= 4 || greaterDone >= 4) return 2; // Initiate
    return 1; // Observer baseline
  }

  function applyAegisLevel() {
    const level = getAegisLevel();

    document.body.classList.remove('level-1', 'level-2', 'level-3');
    document.body.classList.add(`level-${level}`);
    document.body.dataset.aegisLevel = String(level);

    window.AEGIS_LEVEL = level;
    window.AEGIS_TOTAL_COMPLETED = completedCount();
    window.AEGIS_GREATER_COMPLETED = greaterCompletedCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAegisLevel);
  } else {
    applyAegisLevel();
  }
})();