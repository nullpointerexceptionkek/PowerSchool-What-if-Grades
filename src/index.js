/**************************************
 * 1) Collect existing rows & parse data
 **************************************/
function getGradesFromTable() {
  const table = document.getElementById("scoreTable");
  if (!table) return [];

  const rows = table.querySelectorAll("tbody tr[data-ng-repeat-start]");
  const grades = [];

  rows.forEach((row) => {
    const dateCell = row.querySelector("td:nth-child(1)");
    const categoryCell = row.querySelector("td:nth-child(2) .ng-binding");
    const assignmentCell = row.querySelector("td:nth-child(3) .ng-binding");

    const scoreElement = row.querySelector("td.score .ng-binding");
    const weightedScoreElement = row.querySelector("span.weightedScore");
    const percentElement = row.querySelector(
      'td[data-ng-if*="showPercentGrade"]'
    );
    const gradeElement = row.querySelector(
      'td[data-ng-if*="showLetterGrade"]'
    );

    const date = (dateCell?.textContent || "").trim();
    const category = (categoryCell?.textContent || "").trim();
    const assignment = (assignmentCell?.textContent || "").trim();
    const score = scoreElement ? scoreElement.textContent.trim() : "--";
    const weightedScore = weightedScoreElement
      ? weightedScoreElement.textContent.trim()
      : "";
    const percent = percentElement ? percentElement.textContent.trim() : "--";
    const grade = gradeElement ? gradeElement.textContent.trim() : "--";

    grades.push([date, category, assignment, score, weightedScore, percent, grade]);
  });

  return grades;
}

/*********************************************
 * 2) Convert existing rows' scores into inputs
 *********************************************/
function enableScoreEditing() {
  const rows = document.querySelectorAll("tbody tr[data-ng-repeat-start]");
  rows.forEach((row) => {
    const scoreElement = row.querySelector("td.score .ng-binding");
    const weightedScoreElement = row.querySelector("span.weightedScore");
    let targetElement = weightedScoreElement || scoreElement;
    if (!targetElement) return;
    if (targetElement.querySelector("input")) return;

    const currentScore = targetElement.textContent.trim();
    const parsedScore = currentScore.match(/(\d+(\.\d+)?\/\d+(\.\d+)?)/);
    const defaultValue = parsedScore ? parsedScore[0] : currentScore;

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

/********************************************
 * 3) Build the “What-If” UI & attach listeners
 ********************************************/
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
  weightedToggle.checked = false;
  weightedToggle.addEventListener("change", updateWhatIfGrade);

  weightedToggleLabel.appendChild(weightedToggle);
  weightedToggleContainer.appendChild(weightedToggleLabel);
  container.appendChild(weightedToggleContainer);

  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "Category Weights (Only if weighted calc is enabled)";
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
    addCategoryLine(category, weightContainer);
  });

  fieldset.appendChild(weightContainer);
  container.appendChild(fieldset);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "10px";

  const addGradeBtn = document.createElement("button");
  addGradeBtn.id = "addGradeBtn";
  addGradeBtn.type = "button";
  addGradeBtn.textContent = "+ Add New Grade";
  addGradeBtn.style.marginTop = "10px";
  addGradeBtn.addEventListener("click", addNewGradeRow);

  const addCategoryBtn = document.createElement("button");
  addCategoryBtn.id = "addCategoryBtn";
  addCategoryBtn.type = "button";
  addCategoryBtn.textContent = "+ Add Category";
  addCategoryBtn.style.marginTop = "10px";
  addCategoryBtn.addEventListener("click", addNewCategory);

  buttonContainer.appendChild(addGradeBtn);
  buttonContainer.appendChild(addCategoryBtn);

  container.appendChild(buttonContainer);

  gradeTable.parentElement.insertBefore(container, gradeTable);
}

function addCategoryLine(category, containerEl) {
  if (document.getElementById(`weight_${category.replace(/\s+/g, "_")}`)) {
    return;
  }
  const line = document.createElement("div");
  line.style.marginBottom = "10px";

  const label = document.createElement("label");
  label.textContent = `${category}: `;
  label.className = "weight-label";
  label.style.marginRight = "10px";

  const input = document.createElement("input");
  input.type = "number";
  input.value = "1";
  input.min = 0;
  input.step = 0.1;
  input.className = "weight-input";
  input.id = `weight_${category.replace(/\s+/g, "_")}`;
  input.title = "Set the weight for this category (e.g. 0.4 for 40%)";
  input.addEventListener("input", updateWhatIfGrade);

  line.appendChild(label);
  line.appendChild(input);
  containerEl.appendChild(line);
}

/***********************************
 * 4) Recalculate the "What-If" grade
 ***********************************/
function updateWhatIfGrade() {
  const inputs = document.querySelectorAll("td.score input");
  const categoryWeights = {};
  let totalWeightedGrade = 0;
  let totalWeight = 0;

  const weightedToggle = document.querySelector(
    '#whatIfControlsContainer input[type="checkbox"]'
  );
  const useWeighted = weightedToggle && weightedToggle.checked;

  document.querySelectorAll("#weightContainer input").forEach((input) => {
    const category = input.id.replace("weight_", "").replace(/_/g, " ");
    const w = parseFloat(input.value);
    categoryWeights[category] = isNaN(w) || w < 0 ? 1 : w;
  });

  const categoryGrades = {};
  let totalEarnedAll = 0;
  let totalPossibleAll = 0;

  inputs.forEach((input) => {
    const row = input.closest("tr");
    const categoryEl =
      row.querySelector("td:nth-child(2) .ng-binding") ||
      row.querySelector("td:nth-child(2) select") ||
      row.querySelector("td:nth-child(2) input");
    const category =
      categoryEl?.value?.trim?.() || categoryEl?.textContent?.trim?.() || "";

    const scoreValue = input.value.trim();
    const parts = scoreValue.split("/");
    if (parts.length === 2) {
      const earned = parseFloat(parts[0]);
      const possible = parseFloat(parts[1]);
      if (!isNaN(earned) && !isNaN(possible) && possible > 0) {
        if (!categoryGrades[category]) {
          categoryGrades[category] = { totalEarned: 0, totalPossible: 0 };
        }
        categoryGrades[category].totalEarned += earned;
        categoryGrades[category].totalPossible += possible;
        totalEarnedAll += earned;
        totalPossibleAll += possible;
      }
    }
  });

  let whatIfPercentage = "--";

  if (useWeighted) {
    for (const cat in categoryGrades) {
      const c = categoryGrades[cat];
      const categoryPercent =
        c.totalPossible > 0 ? c.totalEarned / c.totalPossible : 0;
      const weight = categoryWeights[cat] || 1;
      totalWeightedGrade += categoryPercent * weight;
      totalWeight += weight;
    }
    if (totalWeight > 0) {
      whatIfPercentage = ((totalWeightedGrade / totalWeight) * 100).toFixed(2) + "%";
    }
  } else {
    if (totalPossibleAll > 0) {
      whatIfPercentage = ((totalEarnedAll / totalPossibleAll) * 100).toFixed(2) + "%";
    }
  }

  const gradeDisplay = document.querySelector("table.linkDescList td:nth-child(5)");
  if (gradeDisplay) {
    const text = gradeDisplay.textContent.trim();
    const match = text.match(/(\d+\.\d+%)/);
    const originalGrade = match ? match[0] : text;
    gradeDisplay.innerHTML =
      `${originalGrade} <span style="color:#007acc;font-weight:bold;">(${whatIfPercentage} What-If)</span>`;
  }
}

/************************************************************
 * 5) Add a brand-new row at the TOP of the <tbody> (real-time)
 ************************************************************/
function addNewGradeRow() {
  const table = document.getElementById("scoreTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const selectHTML = `
    <select class="score-input">
      ${categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("")}
    </select>
  `;

  const newRow = document.createElement("tr");
  newRow.setAttribute("data-ng-repeat-start", "");

  newRow.innerHTML = `
    <td>
      <input
        type="text"
        class="score-input"
        placeholder="Date (e.g. 10/01)"
      />
    </td>
    <td>
      ${selectHTML}
    </td>
    <td>
      <input
        type="text"
        class="score-input"
        placeholder="Assignment"
      />
    </td>
    <td colspan="7" class="text-center"></td>
    <td class="score text-center">
      <span class="ng-binding">
        <input
          type="text"
          class="score-input"
          placeholder="e.g. 8/10"
          title="Enter earned/possible points"
        />
      </span>
    </td>
    <td class="text-center">
      <span class="ng-binding">--</span>
    </td>
    <td class="text-center">
      <span class="ng-binding">--</span>
    </td>
    <td class="text-center">
      <button class="delete-row-btn" style="padding: 4px 8px;">
        Delete
      </button>
    </td>
  `;

  tbody.prepend(newRow);

  const scoreInput = newRow.querySelector("td.score input");
  if (scoreInput) {
    scoreInput.addEventListener("input", updateWhatIfGrade);
  }

  const categorySelect = newRow.querySelector("td:nth-child(2) select");
  if (categorySelect) {
    categorySelect.addEventListener("change", updateWhatIfGrade);
  }

  const deleteBtn = newRow.querySelector(".delete-row-btn");
  deleteBtn.addEventListener("click", () => {
    newRow.remove();
    updateWhatIfGrade();
  });

  updateWhatIfGrade();
}

/*************************************************************
 * 6) Add a brand-new category to the system & update the UI
 *************************************************************/
function addNewCategory() {
  const newCat = prompt("Enter new category name:");
  if (!newCat) return;
  const catTrim = newCat.trim();
  if (!catTrim) return;
  if (categories.includes(catTrim)) {
    alert(`Category "${catTrim}" already exists.`);
    return;
  }
  categories.push(catTrim);

  const weightContainer = document.getElementById("weightContainer");
  if (weightContainer) {
    addCategoryLine(catTrim, weightContainer);
  }

  const allSelects = document.querySelectorAll(
    'tr[data-ng-repeat-start] td:nth-child(2) select.score-input'
  );
  allSelects.forEach((sel) => {
    const option = new Option(catTrim, catTrim);
    sel.add(option);
  });

  updateWhatIfGrade();
}

/***********************************
 * 7) Add styling with no comments
 ***********************************/
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
#addGradeBtn, #addCategoryBtn {
  margin-top: 0 !important;
}
.delete-row-btn {
  background: #f44336;
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
.delete-row-btn:hover {
  background: #d32f2f;
}
`;
document.head.appendChild(style);

/**********************************
 * 8) Initialize everything on load
 **********************************/
const categories = [...new Set(getGradesFromTable().map((row) => row[1]))];
createCategoryWeightUI(categories);
enableScoreEditing();
updateWhatIfGrade();
