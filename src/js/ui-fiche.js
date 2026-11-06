import { state } from "./state.js";
import * as calculs from "./calculs.js";
import * as validation from "./validation.js";

const $ = id => document.getElementById(id);

export function ouvrirFiche(clientId) {
  state.ficheClientId = clientId;
  renderFiche();
}

export function fermerFiche() {
  state.ficheClientId = null;
  renderFiche();
}

function afficherFiche(visible) {
  const fiche = $("fiche-client");
  if (fiche instanceof HTMLDialogElement) {
    if (visible && !fiche.open) fiche.showModal();
    if (!visible && fiche.open) fiche.close();
  } else {
    fiche.hidden = !visible;
  }
}

export function renderFiche() {
  const client = state.clients.find(c => c.id === state.ficheClientId);

  if (!client) {
    afficherFiche(false);
    return;
  }
  afficherFiche(true);

  const solde = calculs.soldeClient(client.id, state.operations);
  const disponible = calculs.creditDisponible(client, state.operations);
  const statuts = calculs.statutsClient(client, state.operations, validation.aujourdhuiISO());

  $("fiche-nom").textContent = client.nom;
  $("fiche-telephone").textContent = client.telephone || "Pas de téléphone";
  $("fiche-solde").textContent = validation.formaterMAD(solde);
  $("fiche-plafond").textContent = validation.formaterMAD(client.plafond);
  $("fiche-disponible").textContent = validation.formaterMAD(disponible);

  renderBadges($("fiche-badges"), statuts);
  renderHistorique(client.id);
}
const BADGES = {
  "a-jour":    { texte: "À jour",          classe: "badge-a-jour" },
  "en-dette":  { texte: "En dette",        classe: "badge-en-dette" },
  "en-retard": { texte: "En retard",       classe: "badge-en-retard" },
  "plafond":   { texte: "Plafond atteint", classe: "badge-plafond" },
};

export function renderBadges(conteneur, statuts) {
  conteneur.replaceChildren();
  for (const s of statuts) {
    const span = document.createElement("span");
    span.className = `badge ${BADGES[s].classe}`;
    span.textContent = BADGES[s].texte;
    conteneur.append(span);
  }
}

export function renderHistorique(clientId) {
  const liste = $("historique");
  const modele = $("modele-operation");
  liste.replaceChildren();

  const ops = state.operations
    .filter(o => o.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));

  $("historique-vide").hidden = ops.length > 0;

  for (const op of ops) {
    const li = modele.content.cloneNode(true).firstElementChild;
    li.dataset.operationId = op.id;
    li.classList.add(op.type === "achat" ? "operation-achat" : "operation-remboursement");
    const nom = op.libelle || (op.type === "achat" ? "Achat" : "Remboursement");
    li.querySelector(".operation-libelle").textContent = nom;
    li.querySelector(".operation-date").textContent = op.date;
    li.querySelector(".operation-montant").textContent = validation.formaterMAD(op.montant);
    li.querySelector(".nom-sr").textContent = " " + nom;
    liste.append(li);
  }
}


