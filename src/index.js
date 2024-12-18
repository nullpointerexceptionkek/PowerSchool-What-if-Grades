function getGradesFromTable() {
  const table = document.getElementById('scoreTable');
  if (!table) return [];

  const rows = table.querySelectorAll('tbody tr[data-ng-repeat-start]');
  const grades = [];

  rows.forEach(row => {
      const date = (row.querySelector('td:nth-child(1)')?.textContent || '').trim();
      const category = (row.querySelector('td:nth-child(2) .ng-binding')?.textContent || '').trim();
      const assignment = (row.querySelector('td:nth-child(3) .ng-binding')?.textContent || '').trim();

      const scoreElement = row.querySelector('td.score .ng-binding');
      const weightedScoreElement = row.querySelector('span.weightedScore');
      const percentElement = row.querySelector('td[data-ng-if*="showPercentGrade"]');
      const gradeElement = row.querySelector('td[data-ng-if*="showLetterGrade"]');

      let score = scoreElement ? scoreElement.textContent.trim() : '--';
      let weightedScore = weightedScoreElement ? weightedScoreElement.textContent.trim() : '';
      const percent = percentElement ? percentElement.textContent.trim() : '--';
      const grade = gradeElement ? gradeElement.textContent.trim() : '--';

      // If weighted score exists, we consider that the "primary" editable score
      // Otherwise, fallback to the original score
      let primaryScore = weightedScore || score;

      grades.push([date, category, assignment, score, weightedScore, percent, grade]);
  });

  return grades;
}

function enableScoreEditing() {
  const rows = document.querySelectorAll('tbody tr[data-ng-repeat-start]');
  rows.forEach(row => {
      const scoreElement = row.querySelector('td.score .ng-binding');
      const weightedScoreElement = row.querySelector('span.weightedScore');

      // Determine which element we will replace with an input
      let targetElement = weightedScoreElement || scoreElement;
      if (!targetElement) return;

      let currentScore = targetElement.textContent.trim();
      // Parse a pattern like x/x or x.x/x.x
      let parsedScore = currentScore.match(/(\d+(\.\d+)?\/\d+(\.\d+)?)/);
      let defaultValue = parsedScore ? parsedScore[0] : currentScore;

      const input = document.createElement('input');
      input.type = 'text';
      input.value = defaultValue;
      input.className = 'score-input';
      input.addEventListener('input', updateWhatIfGrade);

      // Clear target element and append input
      targetElement.textContent = '';
      targetElement.appendChild(input);
  });
}

function createCategoryWeightUI(categories) {
  const gradeTable = document.querySelector('table.linkDescList');
  if (!gradeTable) return;

  const container = document.createElement('div');
  container.id = 'whatIfControlsContainer';

  // Add a checkbox to toggle weighted calculation (default unchecked)
  const weightedToggleLabel = document.createElement('label');
  weightedToggleLabel.textContent = 'Use Weighted Calculation';
  weightedToggleLabel.style.fontWeight = 'bold';

  const weightedToggle = document.createElement('input');
  weightedToggle.type = 'checkbox';
  weightedToggle.checked = false; // default to point-based
  weightedToggle.style.marginLeft = '10px';
  weightedToggle.addEventListener('change', updateWhatIfGrade);

  weightedToggleLabel.appendChild(weightedToggle);
  container.appendChild(weightedToggleLabel);
  container.appendChild(document.createElement('br'));
  container.appendChild(document.createElement('br'));

  const weightContainer = document.createElement('div');
  weightContainer.id = 'weightContainer';

  categories.forEach(category => {
      const label = document.createElement('label');
      label.textContent = `${category}: `;
      label.className = 'weight-label';
      
      const input = document.createElement('input');
      input.type = 'number';
      input.value = '1'; // default weight
      input.min = 0;
      input.step = 0.1;
      input.className = 'weight-input';
      input.id = `weight_${category.replace(/\s+/g, '_')}`;
      input.addEventListener('input', updateWhatIfGrade);

      weightContainer.appendChild(label);
      weightContainer.appendChild(input);
      weightContainer.appendChild(document.createElement('br'));
  });

  container.appendChild(weightContainer);
  gradeTable.parentElement.insertBefore(container, gradeTable);
}

function updateWhatIfGrade() {
  const inputs = document.querySelectorAll('td.score input');
  const categoryWeights = {};
  let totalWeightedGrade = 0;
  let totalWeight = 0;

  const weightedToggle = document.querySelector('#whatIfControlsContainer input[type="checkbox"]');
  const useWeighted = weightedToggle && weightedToggle.checked;

  // Gather category weights
  document.querySelectorAll('#weightContainer input').forEach(input => {
      const category = input.id.replace('weight_', '').replace(/_/g, ' ');
      const w = parseFloat(input.value);
      categoryWeights[category] = (isNaN(w) || w < 0) ? 1 : w; // default to 1 if invalid
  });

  const categoryGrades = {};

  // Parse scores for each assignment input
  let totalEarnedAll = 0;
  let totalPossibleAll = 0;

  inputs.forEach(input => {
      const row = input.closest('tr');
      const category = (row.querySelector('td:nth-child(2) .ng-binding')?.textContent || '').trim();
      
      // Expect format: "earned/possible" with decimals allowed
      const scoreValue = input.value.trim();
      const parts = scoreValue.split('/');
      if (parts.length === 2) {
          const earned = parseFloat(parts[0]);
          const possible = parseFloat(parts[1]);
          // Validate values
          if (!isNaN(earned) && !isNaN(possible) && possible > 0) {
              // For category-based tracking (weighted calculation)
              if (!categoryGrades[category]) {
                  categoryGrades[category] = { totalEarned: 0, totalPossible: 0 };
              }
              categoryGrades[category].totalEarned += earned;
              categoryGrades[category].totalPossible += possible;

              // For non-weighted calculation
              totalEarnedAll += earned;
              totalPossibleAll += possible;
          }
      }
  });

  let whatIfPercentage = '--';

  if (useWeighted) {
      // Weighted calculation
      for (const category in categoryGrades) {
          const catData = categoryGrades[category];
          const categoryPercent = (catData.totalPossible > 0) ? (catData.totalEarned / catData.totalPossible) : 0;
          const weight = categoryWeights[category] || 1;
          totalWeightedGrade += categoryPercent * weight;
          totalWeight += weight;
      }

      if (totalWeight > 0) {
          whatIfPercentage = ((totalWeightedGrade / totalWeight) * 100).toFixed(2) + '%';
      }

  } else {
      // Point-based calculation (no weighting)
      if (totalPossibleAll > 0) {
          whatIfPercentage = ((totalEarnedAll / totalPossibleAll) * 100).toFixed(2) + '%';
      }
  }

  // Update display
  const gradeDisplay = document.querySelector('table.linkDescList td:nth-child(5)');
  if (gradeDisplay) {
      // Extract original grade if present
      const match = gradeDisplay.textContent.match(/(\d+\.\d+%)/);
      const originalGrade = match ? match[0] : '';
      gradeDisplay.innerHTML = `${originalGrade} (${whatIfPercentage} What-If)`;
  }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
.score-input, .weight-input {
  padding: 5px;
  margin: 5px;
  font-size: 14px;
  width: 80px;
}
.weight-label {
  font-size: 14px;
  font-weight: bold;
}
#whatIfControlsContainer {
  margin-bottom: 20px;
}
`;
document.head.appendChild(style);

// Initialize
const categories = [...new Set(getGradesFromTable().map(row => row[1]))];
createCategoryWeightUI(categories);
enableScoreEditing();
updateWhatIfGrade();
