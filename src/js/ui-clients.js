import {
  obtenirState,
  calculerSoldeClient,
  obtenirStatutClient
} from "./state.js";

export function formaterMontant(montant) {
  return (montant / 100).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MAD";
}

export function renderListeClients() {
  const state = obtenirState();
  const liste = document.querySelector("#liste-clients");
  const modele = document.querySelector("#modele-client");
  const recherche = document.querySelector("#recherche").value.trim().toLocaleLowerCase();
  const filtre = document.querySelector("#filtre-statut").value;
  const tri = document.querySelector("#tri").value;

  liste.replaceChildren();

  let clients = state.clients.filter((client) => {
    const correspondAuNom = client.nom.toLocaleLowerCase().includes(recherche);
    const correspondAuTelephone = client.telephone.includes(recherche);
    const statut = obtenirStatutClient(client.id);
    const correspondAuStatut = filtre === "tous" || statut === filtre;

    return (correspondAuNom || correspondAuTelephone) && correspondAuStatut;
  });

  if (tri === "nom") {
    clients.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }

  if (tri === "solde") {
    clients.sort((a, b) => calculerSoldeClient(b.id) - calculerSoldeClient(a.id));
  }

  if (tri === "recent") {
    clients.sort((a, b) => {
      const dateA = obtenirDateDerniereOperation(a.id);
      const dateB = obtenirDateDerniereOperation(b.id);
      return dateB.localeCompare(dateA);
    });
  }

  clients.forEach((client) => {
    const element = modele.content.cloneNode(true);
    const carte = element.querySelector("li");
    const solde = calculerSoldeClient(client.id);
    const statut = obtenirStatutClient(client.id);

    carte.dataset.clientId = client.id;
    element.querySelector(".client-nom").textContent = client.nom;
    element.querySelector(".client-telephone").textContent =
      client.telephone || "Téléphone non renseigné";
    element.querySelector(".client-solde").textContent = formaterMontant(solde);

    const badge = document.createElement("span");
    badge.classList.add("badge");
    badge.classList.add(`badge-${statut}`);
    badge.textContent = obtenirLibelleStatut(statut);
    element.querySelector(".client-badges").append(badge);

    element.querySelectorAll(".nom-sr").forEach((span) => {
      span.textContent = ` ${client.nom}`;
    });

    liste.append(element);
  });
}

function obtenirDateDerniereOperation(clientId) {
  const operations = obtenirState().operations.filter(
    (operation) => operation.clientId === clientId
  );

  if (operations.length === 0) {
    return "0000-00-00";
  }

  return operations.reduce((date, operation) => {
    return operation.date > date ? operation.date : date;
  }, "0000-00-00");
}

function obtenirLibelleStatut(statut) {
  const libelles = {
    "a-jour": "À jour",
    "en-dette": "En dette",
    "en-retard": "En retard",
    plafond: "Plafond atteint"
  };

  return libelles[statut];
}

export function renderTableauDeBord() {
  const state = obtenirState();
  const totalDu = document.querySelector("#total-du");
  const nbClients = document.querySelector("#nb-clients");
  const nbEnDette = document.querySelector("#nb-en-dette");
  const nbEnRetard = document.querySelector("#nb-en-retard");

  let totalDuCentimes = 0;
  let nombreEnDette = 0;
  let nombreEnRetard = 0;

  state.clients.forEach((client) => {
    const solde = calculerSoldeClient(client.id);
    const statut = obtenirStatutClient(client.id);

    totalDuCentimes += Math.max(solde, 0);

    if (solde > 0) {
      nombreEnDette++;
    }

    if (statut === "en-retard") {
      nombreEnRetard++;
    }
  });

  totalDu.textContent = formaterMontant(totalDuCentimes);
  nbClients.textContent = state.clients.length;
  nbEnDette.textContent = nombreEnDette;
  nbEnRetard.textContent = nombreEnRetard;
}

export function renderEtatsVides() {
  const state = obtenirState();
  const liste = document.querySelector("#liste-clients");
  const etatVide = document.querySelector("#etat-vide");
  const etatAucunResultat = document.querySelector("#etat-aucun-resultat");

  etatVide.classList.toggle("hidden", state.clients.length !== 0);
  etatAucunResultat.classList.toggle(
    "hidden",
    state.clients.length === 0 || liste.children.length !== 0
  );
}

export function initFiltres(onChange) {
  document.querySelector("#recherche").addEventListener("input", onChange);
  document.querySelector("#filtre-statut").addEventListener("change", onChange);
  document.querySelector("#tri").addEventListener("change", onChange);
}

export function reinitialiserFiltres() {
  document.querySelector("#recherche").value = "";
  document.querySelector("#filtre-statut").value = "tous";
  document.querySelector("#tri").value = "nom";
}

export function gererClicListeClients(e) {
  const bouton = e.target.closest("button[data-action]");

  if (!bouton) {
    return null;
  }

  const carte = bouton.closest("[data-client-id]");

  if (!carte) {
    return null;
  }

  return {
    action: bouton.dataset.action,
    id: carte.dataset.clientId
  };
}

export function ouvrirDialogClient(idOuNull = null) {
  const dialog = document.querySelector("#dialog-client");
  const titre = document.querySelector("#dialog-client-titre");
  const formulaire = document.querySelector("#form-client");
  const champId = document.querySelector("#client-id");

  formulaire.reset();
  afficherErreursClient({});
  champId.value = idOuNull || "";

  if (idOuNull) {
    const client = obtenirState().clients.find((element) => element.id === idOuNull);

    if (!client) {
      return;
    }

    titre.textContent = "Modifier le client";
    document.querySelector("#client-nom").value = client.nom;
    document.querySelector("#client-telephone").value = client.telephone;
    document.querySelector("#client-plafond").value = (client.plafond / 100).toFixed(2);
  } else {
    titre.textContent = "Nouveau client";
  }

  dialog.showModal();
  document.querySelector("#client-nom").focus();
}

export function lireFormulaireClient() {
  const valeurPlafond = document.querySelector("#client-plafond").value.trim().replace(",", ".");
  const plafondValide = /^\d+(\.\d{1,2})?$/.test(valeurPlafond);

  return {
    id: document.querySelector("#client-id").value,
    nom: document.querySelector("#client-nom").value,
    telephone: document.querySelector("#client-telephone").value,
    plafond: plafondValide ? Math.round(Number(valeurPlafond) * 100) : NaN
  };
}

export function afficherErreursClient(erreurs) {
  const champs = ["nom", "telephone", "plafond"];
  let premierChamp = null;

  champs.forEach((champ) => {
    const input = document.querySelector(`#client-${champ}`);
    const message = document.querySelector(`#client-${champ}-erreur`);
    const erreur = erreurs[champ] || "";

    input.classList.toggle("champ-invalide", Boolean(erreur));
    input.setAttribute("aria-invalid", String(Boolean(erreur)));

    if (erreur) {
      input.setAttribute("aria-describedby", `client-${champ}-erreur`);
      message.textContent = erreur;
      message.classList.remove("hidden");

      if (!premierChamp) {
        premierChamp = input;
      }
    } else {
      input.removeAttribute("aria-describedby");
      message.textContent = "";
      message.classList.add("hidden");
    }
  });

  if (premierChamp) {
    premierChamp.focus();
  }
}

export function afficherNotification(message) {
  document.querySelector("#notification").textContent = message;
}

export function afficherErreurStockage(message) {
  const zone = document.querySelector("#erreur-stockage");
  document.querySelector("#erreur-stockage-message").textContent = message;
  zone.classList.remove("hidden");
}
