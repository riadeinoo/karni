import { state } from './state.js';
import { renderFiche, renderHistorique } from './ui-fiche.js';
import { renderBadges } from './ui-fiche.js';
w
export function ouvrirFiche(clientId) {
state.ficheclient = clientId;
renderFiche();
renderHistorique(clientId);

const dialogfiche = document.getElementById("dialog-fiche");
if (dialogfiche && !dialogfiche.open) {
    dialogfiche.showModal();
}
}

export function renderfiche() {
    const clientId =   state.clients.find(c => c.id === state.ficheClientId) ? state.ficheClientId : null;
    if (!clientId) return;

document.getElementById("fiche-nom").textContent = Clients-nom;
document.getElementById("fiche-telephone").textContent = Clients-telephone;

const solde = client.solde || 0;
const plafond = client.plafond || 0;
const disponible = plafond - solde;

document.getElementById("fiche-solde").textContent = `${solde.toFixed(2)} MAD`;
  document.getElementById("fiche-plafond").textContent = `${plafond.toFixed(2)} MAD`;
  document.getElementById("fiche-disponible").textContent = `${disponible.toFixed(2)} MAD`;

  const conteneurBadges = document.getElementById("fiche-badges");
  if (conteneurBadges) {
    conteneurBadges.innerHTML = "";
    renderBadges(conteneurBadges, client.statuts);
  }
}

export function fermerFiche() {
    const dialogfiche = document.getElementById("dialog-fiche");
    if (dialogfiche && dialogfiche.open) {
        dialogfiche.close();
    }
}
export function renderBadges(conteneur, statuts) {
  if (!statuts || statuts.length === 0) return;

  statuts.forEach(statut => {
    const badge = document.createElement("span");
    badge.className = "rounded px-2 py-0.5 text-xs font-semibold";
    if (statut === "a-jour") {
      badge.classList.add("bg-green-100", "text-green-800");
      badge.textContent = "À jour";
    } else if (statut === "en-dette") {
      badge.classList.add("bg-karni-ambre/20", "text-karni-ambre");
      badge.textContent = "En dette";
    } else if (statut === "en-retard") {
      badge.classList.add("bg-karni-rouge-clair", "text-karni-rouge");
      badge.textContent = "En retard";
    }
    conteneur.appendChild(badge);
  });
}

