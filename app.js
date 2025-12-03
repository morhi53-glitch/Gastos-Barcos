let currentBoat = "Punta Martiño";
let expenseChart = null;

const CATEGORIES = ["Combustible", "Mantenimiento", "Amarre", "Provisiones", "Otros"];

function loadExpenses() {
  const data = localStorage.getItem("boatExpenses");
  return data ? JSON.parse(data) : {
    "Punta Martiño": [],
    "Praia Canelas": [],
    "Thamira": []
  };
}

function saveExpenses(expenses) {
  localStorage.setItem("boatExpenses", JSON.stringify(expenses));
}

function groupExpensesByCategory(expenses) {
  const grouped = {};
  CATEGORIES.forEach(cat => grouped[cat] = 0);

  expenses.forEach(exp => {
    const cat = exp.category || "Otros";
    if (grouped.hasOwnProperty(cat)) {
      grouped[cat] += parseFloat(exp.amount);
    } else {
      grouped["Otros"] += parseFloat(exp.amount);
    }
  });

  return grouped;
}

function renderChart() {
  const expenses = loadExpenses();
  const boatExpenses = expenses[currentBoat] || [];
  const grouped = groupExpensesByCategory(boatExpenses);

  const ctx = document.getElementById('expenseChart').getContext('2d');

  // Destruir gráfico anterior si existe
  if (expenseChart) expenseChart.destroy();

  expenseChart = new Chart(ctx, {
    type: 'doughnut',
     {
      labels: CATEGORIES,
      datasets: [{
        data: CATEGORIES.map(cat => grouped[cat].toFixed(2)),
        backgroundColor: [
          '#1e5f7a', // Combustible
          '#3a9bc9', // Mantenimiento
          '#4ecdc4', // Amarre
          '#ffd166', // Provisiones
          '#ef476f'  // Otros
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: $${context.parsed}`;
            }
          }
        }
      }
    }
  });
}

function renderExpenses() {
  const expenses = loadExpenses();
  const list = document.getElementById("list");
  list.innerHTML = "";

  const boatExpenses = expenses[currentBoat] || [];
  boatExpenses.forEach((exp, i) => {
    const div = document.createElement("div");
    const cat = exp.category ? `<small>[${exp.category}]</small> ` : '';
    div.innerHTML = `
      <span>${cat}<strong>${exp.date}</strong>: ${exp.description} – $${parseFloat(exp.amount).toFixed(2)}</span>
      <button onclick="deleteExpense(${i})">🗑️</button>
    `;
    list.appendChild(div);
  });
}

function deleteExpense(index) {
  const expenses = loadExpenses();
  expenses[currentBoat].splice(index, 1);
  saveExpenses(expenses);
  updateUI();
}

function updateUI() {
  renderExpenses();
  renderChart();
}

// Eventos
document.getElementById("boat").addEventListener("change", (e) => {
  currentBoat = e.target.value;
  updateUI();
});

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  const expenses = loadExpenses();
  expenses[currentBoat].push({ description, amount, category, date });
  saveExpenses(expenses);
  updateUI();
  document.getElementById("form").reset();
  document.getElementById("date").valueAsDate = new Date();
});

document.getElementById("export").addEventListener("click", () => {
  const dataStr = JSON.stringify(loadExpenses(), null, 2);
  const dataUri = "application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", "gastos-barcos.json");
  linkElement.click();
});

document.getElementById("import").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data && typeof data === "object") {
        localStorage.setItem("boatExpenses", JSON.stringify(data));
        updateUI();
        alert("Datos importados con éxito.");
      }
    } catch (err) {
      alert("Error al leer el archivo JSON.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// Inicializar
document.getElementById("date").valueAsDate = new Date();
updateUI();

// Service Worker (igual que antes)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err));
  });
}
