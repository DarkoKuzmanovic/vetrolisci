// Card validation mechanics for Vetrolisci

export function validateCards(grid) {
  const newGrid = [...grid];
  let validatedCount = 0;

  // Check each position for potential validation
  for (let i = 0; i < 9; i++) {
    const card = newGrid[i];
    const requiredValue = i + 1; // Position 0 needs value 1, position 1 needs value 2, etc.

    if (card && card.faceUp && card.value === requiredValue && !card.validated) {
      // Only validate if there's a face-down card underneath
      if (card.stackedCard) {
        newGrid[i] = { ...card, validated: true };
        validatedCount++;
      }
      // Do NOT auto-validate cards just for being in correct position
    }
  }

  return { grid: newGrid, validatedCount };
}

export function canValidatePosition(position, grid) {
  const requiredValue = position + 1;
  const card = grid[position];

  return card && card.faceUp && card.value === requiredValue && !card.validated;
}

export function getValidationStatus(grid) {
  const positions = [];

  for (let i = 0; i < 9; i++) {
    const card = grid[i];
    const requiredValue = i + 1;

    positions.push({
      position: i,
      requiredValue,
      hasCard: card !== null,
      cardValue: card?.value || null,
      isFaceUp: card?.faceUp || false,
      isValidated: card?.validated || false,
      canValidate: canValidatePosition(i, grid),
      hasStack: card?.stackedCard !== null,
    });
  }

  return positions;
}
