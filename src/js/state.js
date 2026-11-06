let state;

function obtenirDateAujourdhui() {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}
// Initialiser les données en mémoire.
export function initialiserState() {
    state = {
        app: "karni",
        version: 1,
        clients: [],
        operations: []
    };

    return { state, erreur: false };
}

export function obtenirState() {
  return state;
}
// Remplacer les données en mémoire par un nouveau carnet.
export function definirState(carnet) {
    state = carnet;
}
export function calculerSoldeClient(clientId) {
  let solde = 0;

  state.operations.forEach((operation) => {
    if (operation.clientId === clientId) {
      if (operation.type === "achat") {
        solde += operation.montant;
      }

      if (operation.type === "remboursement") {
        solde -= operation.montant;
      }
    }
  });

  return solde;
}

export function obtenirDateDernierReglement(clientId) {
  const remboursements = state.operations.filter(
    (operation) => operation.clientId === clientId && operation.type === "remboursement"
  );

  if (remboursements.length > 0) {
    return remboursements.reduce((date, operation) => {
      return operation.date > date ? operation.date : date;
    }, "0000-00-00");
  }

  const achats = state.operations.filter(
    (operation) => operation.clientId === clientId && operation.type === "achat"
  );

  if (achats.length === 0) {
    return null;
  }

  return achats.reduce((date, operation) => {
    return operation.date < date ? operation.date : date;
  }, "9999-99-99");
}

export function obtenirStatutClient(clientId) {
  const solde = calculerSoldeClient(clientId);
  const client = state.clients.find((element) => element.id === clientId);

  if (solde <= 0) {
    return "a-jour";
  }

  if (client && solde >= client.plafond) {
    return "plafond";
  }

  const dateReglement = obtenirDateDernierReglement(clientId);

  if (!dateReglement) {
    return "en-dette";
  }

  const aujourdHui = new Date(`${obtenirDateAujourdhui()}T00:00:00`);
  const dateOperation = new Date(`${dateReglement}T00:00:00`);
  const joursEcoules = Math.floor(
    (aujourdHui - dateOperation) / (1000 * 60 * 60 * 24)
  );

  return joursEcoules >= 30 ? "en-retard" : "en-dette";
}

export function validerClient(donnees, idActuel = "") {
  const erreurs = {};
  const nom = donnees.nom.trim();
  const telephone = donnees.telephone.trim();
  const plafond = donnees.plafond;

  if (nom.length < 2 || nom.length > 40 || !/^[\p{L} '-]+$/u.test(nom)) {
    erreurs.nom = "Le nom doit contenir 2 à 40 caractères : lettres, espaces, apostrophes ou tirets.";
  }

  if (telephone !== "" && !/^0[567]\d{8}$/.test(telephone)) {
    erreurs.telephone = "Le téléphone doit contenir 10 chiffres et commencer par 05, 06 ou 07.";
  }

  if (!Number.isInteger(plafond) || plafond < 5000 || plafond > 1000000) {
    erreurs.plafond = "Le plafond doit être compris entre 50 et 10 000 MAD.";
  }

  return erreurs;
}

export function ajouterClient(donnees) {
  const client = {
    id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nom: donnees.nom.trim(),
    telephone: donnees.telephone.trim(),
    plafond: donnees.plafond,
    creeLe: obtenirDateAujourdhui()
  };

  state.clients.push(client);
  return true;
}

export function modifierClient(id, donnees) {
  const client = state.clients.find((element) => element.id === id);

  if (!client) {
    return false;
  }

  client.nom = donnees.nom.trim();
  client.telephone = donnees.telephone.trim();
  client.plafond = donnees.plafond;

  return true;
}

export function supprimerClient(id) {
    const solde = calculerSoldeClient(id);

    if (solde > 0) {
        return { succes: false, raison: "dette" };
    }

    state.clients = state.clients.filter(
        (client) => client.id !== id
    );

    state.operations = state.operations.filter(
        (operation) => operation.clientId !== id
    );

    return { succes: true, raison: "" };
}
