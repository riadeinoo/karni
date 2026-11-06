// Karni — point d'entrée, chargé comme module ES (<script type="module">).
// Lis d'abord le format des données (brief) et le HTML fourni, puis découpe ton code en modules
// (state.js, storage.js, validation.js, calculs.js, ui.js) que tu importes ici.
import {
  initialiserState,
  obtenirState,
  validerClient,
  ajouterClient,
  modifierClient,
  supprimerClient,
  calculerSoldeClient
} from "./state.js";

import {
  renderListeClients,
  renderTableauDeBord,
  renderEtatsVides,
  initFiltres,
  reinitialiserFiltres,
  gererClicListeClients,
  ouvrirDialogClient,
  lireFormulaireClient,
  afficherErreursClient,
  afficherNotification,
  afficherErreurStockage
} from "./ui-clients.js";

function init() {
  const resultat = initialiserState();

  if (resultat.erreur) {
    afficherErreurStockage("Le stockage local est indisponible. Les données ne seront peut-être pas conservées après fermeture de la page.");
  }

  document.querySelector("#nouveau-client").addEventListener("click", () => {
    ouvrirDialogClient();
  });

  document.querySelector("#client-annuler").addEventListener("click", () => {
    document.querySelector("#dialog-client").close();
  });

  document.querySelector("#form-client").addEventListener("submit", soumettreFormClient);

  initFiltres(render);

  document.querySelector("#reinitialiser-filtres").addEventListener("click", () => {
    reinitialiserFiltres();
    render();
  });

  document.querySelector("#liste-clients").addEventListener("click", gererActionClient);

  render();
}

function render() {
  renderListeClients();
  renderTableauDeBord();
  renderEtatsVides();
}

function soumettreFormClient(e) {
  e.preventDefault();

  const donnees = lireFormulaireClient();
  const erreurs = validerClient(donnees, donnees.id);

  afficherErreursClient(erreurs);

  if (Object.keys(erreurs).length > 0) {
    return;
  }

  const succes = donnees.id
    ? modifierClient(donnees.id, donnees)
    : ajouterClient(donnees);

  if (!succes) {
    afficherErreurStockage("Impossible d'enregistrer les modifications. Vérifiez l'espace de stockage de votre navigateur.");
    return;
  }

  document.querySelector("#dialog-client").close();
  afficherNotification(donnees.id ? "Client modifié avec succès." : "Client ajouté avec succès.");
  render();
}

async function gererActionClient(e) {
  const resultat = gererClicListeClients(e);

  if (!resultat) {
    return;
  }

  if (resultat.action === "modifier-client") {
    ouvrirDialogClient(resultat.id);
    return;
  }

  if (resultat.action === "supprimer-client") {
    demanderSuppressionClient(resultat.id);
    return;
  }

  if (resultat.action === "ouvrir-fiche") {
    afficherNotification("La fiche client sera reliée au module Karima");
  }
}

async function demanderSuppressionClient(id) {
  const solde = calculerSoldeClient(id);
  const client = obtenirState().clients.find((element) => element.id === id);

  if (solde > 0) {
    afficherNotification("Suppression impossible : ce client possède encore une dette.");
    return;
  }

  const confirme = await demanderConfirmation(
    "Supprimer ce client ?",
    `Voulez-vous vraiment supprimer ${client.nom} ? Ses opérations seront également supprimées.`
  );

  if (!confirme) {
    return;
  }

  const resultat = supprimerClient(id);

  if (!resultat.succes) {
    afficherErreurStockage("Impossible de sauvegarder la suppression.");
    return;
  }

  afficherNotification("Client supprimé avec succès.");
  render();
}

function demanderConfirmation(titre, message) {
  return new Promise((resolve) => {
    const dialog = document.querySelector("#dialog-confirmation");

    document.querySelector("#confirmation-titre").textContent = titre;
    document.querySelector("#confirmation-message").textContent = message;
    document.querySelector("#confirmation-details").replaceChildren();

    dialog.addEventListener("close", function fermer() {
      dialog.removeEventListener("close", fermer);
      resolve(dialog.returnValue === "valider");
    });

    dialog.showModal();
  });
}

init();









