import {
  newClient,
  changeActivity,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

const nameInput = document.getElementById("clientName");
const addBtn = document.getElementById("addClient");
const closeBtn = document.getElementById("closeClient");
const output = document.getElementById("output");

addBtn.onclick = () => {
  if (!nameInput.value) return;
  newClient(nameInput.value);
  nameInput.value = "";
  render();
};

closeBtn.onclick = () => {
  closeClient();
  render();
};

document.querySelectorAll("[data-act]").forEach(btn => {
  btn.onclick = () => {
    changeActivity(btn.dataset.act);
    render();
  };
});

function render() {
  const { state, clients, blocks } = getCurrentState();
  output.textContent = JSON.stringify({ state, clients, blocks }, null, 2);
}

render();
