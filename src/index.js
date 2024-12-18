// Query grades from power school and construct 2D Matrix of the grades
function getGradesFromTable() {
  const table = document.getElementById("scoreTable");
  if (!table) return [];

  const rows = table.querySelectorAll("tbody tr[data-ng-repeat-start]");
  const grades = [];

  rows.forEach((row) => {
    const date = (
      row.querySelector("td:nth-child(1)")?.textContent || ""
    ).trim();
    const category = (
      row.querySelector("td:nth-child(2) .ng-binding")?.textContent || ""
    ).trim();
    const assignment = (
      row.querySelector("td:nth-child(3) .ng-binding")?.textContent || ""
    ).trim();

    const scoreElement = row.querySelector("td.score .ng-binding");
    const weightedScoreElement = row.querySelector("span.weightedScore");
    const percentElement = row.querySelector(
      'td[data-ng-if*="showPercentGrade"]'
    );
    const gradeElement = row.querySelector('td[data-ng-if*="showLetterGrade"]');

    let score = scoreElement ? scoreElement.textContent.trim() : "--";
    let weightedScore = weightedScoreElement
      ? weightedScoreElement.textContent.trim()
      : "";
    const percent = percentElement ? percentElement.textContent.trim() : "--";
    const grade = gradeElement ? gradeElement.textContent.trim() : "--";

    grades.push([
      date,
      category,
      assignment,
      score,
      weightedScore,
      percent,
      grade,
    ]);
  });

  return grades;
}
//replace all the grade with input field
function enableScoreEditing() {
  const rows = document.querySelectorAll("tbody tr[data-ng-repeat-start]");
  rows.forEach((row) => {
    const scoreElement = row.querySelector("td.score .ng-binding");
    const weightedScoreElement = row.querySelector("span.weightedScore");

    let targetElement = weightedScoreElement || scoreElement;
    if (!targetElement) return;

    let currentScore = targetElement.textContent.trim();
    let parsedScore = currentScore.match(/(\d+(\.\d+)?\/\d+(\.\d+)?)/);
    let defaultValue = parsedScore ? parsedScore[0] : currentScore;

    const input = document.createElement("input");
    input.type = "text";
    input.value = defaultValue;
    input.className = "score-input";
    input.title = 'Enter earned/possible points (e.g. "8/10")';
    input.placeholder = "e.g. 8/10";
    input.addEventListener("input", updateWhatIfGrade);

    targetElement.textContent = "";
    targetElement.appendChild(input);
  });
}

function createCategoryWeightUI(categories) {
  const gradeTable = document.querySelector("table.linkDescList");
  if (!gradeTable) return;

  const container = document.createElement("div");
  container.id = "whatIfControlsContainer";

  const heading = document.createElement("h3");
  heading.textContent = "What-If Scenario Calculator";
  heading.style.marginBottom = "10px";
  container.appendChild(heading);

  const instructions = document.createElement("p");
  instructions.textContent =
    'Use the tools below to adjust assignment scores and set category weights to see a "What-If" final grade.';
  instructions.style.marginBottom = "20px";
  instructions.style.fontSize = "14px";
  container.appendChild(instructions);

  const weightedToggleContainer = document.createElement("div");
  weightedToggleContainer.style.marginBottom = "20px";

  const weightedToggleLabel = document.createElement("label");
  weightedToggleLabel.textContent = "Use Weighted Calculation: ";
  weightedToggleLabel.style.fontWeight = "bold";
  weightedToggleLabel.style.display = "inline-block";
  weightedToggleLabel.style.marginRight = "10px";

  const weightedToggle = document.createElement("input");
  weightedToggle.type = "checkbox";
  weightedToggle.checked = false; // default to point-based calculation
  weightedToggle.addEventListener("change", updateWhatIfGrade);

  weightedToggleLabel.appendChild(weightedToggle);
  weightedToggleContainer.appendChild(weightedToggleLabel);
  container.appendChild(weightedToggleContainer);

  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent =
    "Category Weights (Only applies if weighted calculation is enabled)";
  legend.style.fontWeight = "bold";
  legend.style.fontSize = "14px";
  legend.style.marginBottom = "10px";
  fieldset.appendChild(legend);
  fieldset.style.border = "1px solid #ccc";
  fieldset.style.padding = "10px";
  fieldset.style.marginBottom = "20px";

  const weightContainer = document.createElement("div");
  weightContainer.id = "weightContainer";

  categories.forEach((category) => {
    const line = document.createElement("div");
    line.style.marginBottom = "10px";

    const label = document.createElement("label");
    label.textContent = `${category}: `;
    label.className = "weight-label";
    label.style.marginRight = "10px";

    const input = document.createElement("input");
    input.type = "number";
    input.value = "1"; // default weight is 100%
    input.min = 0;
    input.step = 0.1;
    input.className = "weight-input";
    input.id = `weight_${category.replace(/\s+/g, "_")}`;
    input.title =
      "Set the weight for this category (e.g. 0.4 for 40%)";
    input.addEventListener("input", updateWhatIfGrade);

    line.appendChild(label);
    line.appendChild(input);
    weightContainer.appendChild(line);
  });

  fieldset.appendChild(weightContainer);
  container.appendChild(fieldset);

  // Inject before grade table
  gradeTable.parentElement.insertBefore(container, gradeTable);
}

function updateWhatIfGrade() {
  const inputs = document.querySelectorAll("td.score input");
  const categoryWeights = {};
  let totalWeightedGrade = 0;
  let totalWeight = 0;

  const weightedToggle = document.querySelector(
    '#whatIfControlsContainer input[type="checkbox"]'
  );
  const useWeighted = weightedToggle && weightedToggle.checked;

  // Gather category weights
  document.querySelectorAll("#weightContainer input").forEach((input) => {
    const category = input.id.replace("weight_", "").replace(/_/g, " ");
    const w = parseFloat(input.value);
    categoryWeights[category] = isNaN(w) || w < 0 ? 1 : w; // default to 1 if invalid
  });

  const categoryGrades = {};

  // Parse scores for each assignment input
  let totalEarnedAll = 0;
  let totalPossibleAll = 0;

  inputs.forEach((input) => {
    const row = input.closest("tr");
    const category = (
      row.querySelector("td:nth-child(2) .ng-binding")?.textContent || ""
    ).trim();

    const scoreValue = input.value.trim();
    const parts = scoreValue.split("/");
    if (parts.length === 2) {
      const earned = parseFloat(parts[0]);
      const possible = parseFloat(parts[1]);
      if (!isNaN(earned) && !isNaN(possible) && possible > 0) {
        // For category-based tracking (weighted)
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

  let whatIfPercentage = "--";

  if (useWeighted) {
    // Weighted calculation
    for (const category in categoryGrades) {
      const catData = categoryGrades[category];
      const categoryPercent =
        catData.totalPossible > 0
          ? catData.totalEarned / catData.totalPossible
          : 0;
      const weight = categoryWeights[category] || 1;
      totalWeightedGrade += categoryPercent * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      whatIfPercentage =
        ((totalWeightedGrade / totalWeight) * 100).toFixed(2) + "%";
    }
  } else {
    // Point-based calculation
    if (totalPossibleAll > 0) {
      whatIfPercentage =
        ((totalEarnedAll / totalPossibleAll) * 100).toFixed(2) + "%";
    }
  }

  const gradeDisplay = document.querySelector(
    "table.linkDescList td:nth-child(5)"
  );
  if (gradeDisplay) {
    const text = gradeDisplay.textContent.trim();
    const match = text.match(/(\d+\.\d+%)/);
    const originalGrade = match ? match[0] : text;
    gradeDisplay.innerHTML = `${originalGrade} <span style="color:#007acc;font-weight:bold;">(${whatIfPercentage} What-If)</span>`;
  }
}

// Add improved styles
const style = document.createElement("style");
style.textContent = `
#whatIfControlsContainer {
  border: 1px solid #ddd;
  padding: 20px;
  margin-bottom: 20px;
  background: #f9f9f9;
  font-family: Arial, sans-serif;
}

#whatIfControlsContainer h3 {
  margin-top: 0;
  font-family: Arial, sans-serif;
  font-size: 18px;
}

.score-input, .weight-input {
  padding: 5px;
  font-size: 14px;
  width: 80px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.weight-label {
  font-size: 14px;
  font-weight: bold;
}

#weightContainer label {
  display: inline-block;
  width: 150px;
  text-align: right;
}

#weightContainer input {
  margin-left: 10px;
}
`;
document.head.appendChild(style);

// Initialize
const categories = [...new Set(getGradesFromTable().map((row) => row[1]))];
createCategoryWeightUI(categories);
enableScoreEditing();
updateWhatIfGrade();
