import { state } from "./state.js";
import * as calculs from "./calculs.js";
import * as validation from "./validation.js";
import * as storage from "./storage.js";
import { confirmer } from "./ui-confirmation.js";

const $ = id => document.getElementById(id);

export function ouvrirFiche(clientId) {
  state.ficheClientId = clientId;
  $("operation-date").value = validation.aujourdhuiISO();
  renderFiche();
}

export function fermerFiche() {
  state.ficheClientId = null;
  renderFiche();
}

function afficherFiche(visible) {
  const fiche = $("fiche-client");
  if (visible && !fiche.open) fiche.showModal();
  if (!visible && fiche.open) fiche.close();
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
  liste.replaceChildren();

  const ops = state.operations
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

export function gererClicHistorique(e) {
  const bouton = e.target.closest('[data-action="supprimer-operation"]');
  if (!bouton) return;
  supprimerOperation(bouton.closest("li").dataset.operationId);
}

export function soumettreFormOperation(e) {
  e.preventDefault();

  const client = state.clients.find(c => c.id === state.ficheClientId);
  const type = document.querySelector('input[name="operation-type"]:checked').value;
  const montant = validation.parserMontant($("operation-montant").value); // TODO: nom à confirmer avec validation.js (centimes, ou null)
  const date = $("operation-date").value;
  const libelle = $("operation-libelle").value.trim();
  const erreurs = {};

  if (montant === null || montant <= 0) {
    erreurs.montant = "Montant invalide.";
  } else if (type === "achat") {
    const disponible = calculs.creditDisponible(client, state.operations);
    if (montant > disponible) erreurs.montant = `Refusé : crédit disponible ${validation.formaterMAD(disponible)}.`;
  } else {
    const solde = calculs.soldeClient(client.id, state.operations);
    if (montant > solde) erreurs.montant = `Refusé : dépasse le solde (${validation.formaterMAD(solde)}).`;
  }

  if (!date || date > validation.aujourdhuiISO()) erreurs.date = "Date invalide (pas dans le futur).";

  afficherErreursOperation(erreurs);
  if (Object.keys(erreurs).length > 0) return;

  state.operations.push({ id: "o-" + crypto.randomUUID(), clientId: client.id, type, montant, libelle, date });
  storage.sauvegarder(state); // TODO: nom à confirmer avec storage.js
  renderFiche(); 
}

export function afficherErreursOperation(erreurs) {
  let premier = null;
  for (const champ of ["montant", "date", "libelle"]) {
    const input = $("operation-" + champ);
    const zone = $("operation-" + champ + "-erreur");
    const message = erreurs[champ];

    zone.textContent = message || "";
    zone.classList.toggle("hidden", !message);
    input.classList.toggle("champ-invalide", !!message);
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", zone.id);
      premier = premier || input;
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
  }
  if (premier) premier.focus();
}

export async function supprimerOperation(id) {
  const ok = await confirmer({
    titre: "Supprimer cette opération ?",
    message: "Cette action est définitive.",
  });
  if (!ok) return;

  state.operations = state.operations.filter(o => o.id !== id);
  storage.sauvegarder(state); // TODO: nom à confirmer avec storage.js
  renderFiche();
}