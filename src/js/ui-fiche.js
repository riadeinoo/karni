import { obtenirState } from "./state.js";
import * as calculs from "./calculs.js";
import * as validation from "./validation.js";
let ficheClientId = null;

const $ = id => document.getElementById(id);

export function ouvrirFiche(clientId) {
  ficheClientId = clientId;
  renderFiche();
}

export function fermerFiche() {
  ficheClientId = null;
  renderFiche();
}

function afficherFiche(visible) {
  const fiche = $("fiche-client");
  if (visible && !fiche.open) fiche.showModal();
  if (!visible && fiche.open) fiche.close();
}

export function renderFiche() {
const state = obtenirState();
const client = state.clients.find(c => c.id === ficheClientId);
  if (!client) {
    afficherFiche(false);
    return;
  }
  afficherFiche(true);

  const solde = calculs.calculerSolde(client.id, state.operations);
  const disponible = calculs.calculerCreditDisponible(client, state.operations);
  const statut = calculs.calculerStatut(client, state.operations, validation.aujourdhuiISO());
  $("fiche-nom").textContent = client.nom;
  $("fiche-nom").dataset.clientId = client.id;
  $("fiche-telephone").textContent = client.telephone || "Pas de téléphone";
  $("fiche-solde").textContent = validation.formaterMAD(solde);
  $("fiche-plafond").textContent = validation.formaterMAD(client.plafond);
  $("fiche-disponible").textContent = validation.formaterMAD(disponible);

  renderBadges($("fiche-badges"), [statut]);
  renderHistorique(client.id);
}

const BADGES = {
  "À jour": {texte: "À jour",classe: "badge-a-jour"},
  "En dette": {texte: "En dette",classe: "badge-en-dette"},
  "En retard": {texte: "En retard",classe: "badge-en-retard"},
  "Plafond atteint": {texte: "Plafond atteint",classe: "badge-plafond"}
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
  liste.replaceChildren();

  const ops = obtenirState().operations
    .filter(o => o.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));

  $("historique-vide").hidden = ops.length > 0;

  for (const op of ops) {
    const li = $("modele-operation").content.cloneNode(true).firstElementChild;
    const nom = op.libelle || (op.type === "achat" ? "Achat" : "Remboursement");
    li.dataset.operationId = op.id;
    li.classList.add("operation-" + op.type);
    li.querySelector(".operation-libelle").textContent = nom;
    li.querySelector(".operation-date").textContent = op.date;
    li.querySelector(".operation-montant").textContent = validation.formaterMAD(op.montant);
    li.querySelector(".nom-sr").textContent = " " + nom;
    liste.append(li);
  }
}