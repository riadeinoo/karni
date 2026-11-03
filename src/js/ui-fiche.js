import { state } from './state.js';
import { renderFiche, renderHistorique } from './ui-fiche.js';
import { renderBadges } from './ui-fiche.js';

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