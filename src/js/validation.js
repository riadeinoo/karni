export const normaliserTexte = (valeur = "") => {
  if (valeur === null || valeur === undefined) return "";
  return String(valeur)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

export const enCentimes = (valeur) => {
  if (valeur === null || valeur === undefined || valeur === "") {
    return 0;
  }

  if (typeof valeur === "number") {
    if (!Number.isFinite(valeur)) return NaN;
    return Math.round(valeur * 100);
  }

  let texte = String(valeur).trim().replace(/\u00a0/g, "").replace(/\s+/g, "");
  if (!texte) return 0;

  const contientVirgule = texte.includes(",");
  const contientPoint = texte.includes(".");

  if (contientVirgule && contientPoint) {
    const dernierPoint = texte.lastIndexOf(".");
    const derniereVirgule = texte.lastIndexOf(",");
    const separateurDecimal = dernierPoint > derniereVirgule ? "." : ",";
    const separateurMillier = separateurDecimal === "." ? "," : ".";
    texte = texte.replace(new RegExp(`\\${separateurMillier}`, "g"), "");
    texte = texte.replace(separateurDecimal, ".");
  } else if (contientVirgule) {
    const parties = texte.split(",");
    if (parties.length > 2) {
      texte = parties.join("");
    } else {
      texte = `${parties[0]}.${parties[1] ?? "0"}`;
    }
  } else if (contientPoint) {
    const parties = texte.split(".");
    if (parties.length > 2) {
      texte = parties.join("");
    } else {
      texte = `${parties[0]}.${parties[1] ?? "0"}`;
    }
  }

  const nombre = Number(texte);
  if (!Number.isFinite(nombre)) {
    return NaN;
  }

  return Math.round(nombre * 100);
};

export const enTexteMontant = (centimes) => {
  const nombre = Number(centimes ?? 0) / 100;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(nombre);
};

export const formaterMAD = (centimes) => `${enTexteMontant(centimes)} MAD`;

export const aujourdhuiISO = () => {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
};

const erreur = (champ, message) => ({
  field: champ,
  champ,
  message,
});

const estDateValide = (dateTexte) => {
  if (typeof dateTexte !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateTexte)) return false;

  const date = new Date(`${dateTexte}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const aujourdHui = aujourdhuiISO();
  return dateTexte <= aujourdHui;
};

const normaliserNom = (nom) => String(nom ?? "").trim().replace(/\s+/g, " ");

export const validerClient = (client) => {
  if (!client || typeof client !== "object") {
    return {
      ok: false,
      errors: [erreur("client", "Le client est obligatoire.")],
    };
  }

  const erreurs = [];
  const nom = normaliserNom(client.nom);
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,40}$/.test(nom)) {
    erreurs.push(erreur("nom", "Le nom doit contenir de 2 à 40 caractères valides."));
  }

  const telephone = String(client.telephone ?? "").replace(/\s+/g, "");
  if (telephone && !/^0[567]\d{8}$/.test(telephone)) {
    erreurs.push(erreur("telephone", "Le téléphone doit commencer par 05, 06 ou 07 et contenir 10 chiffres."));
  }

  const plafondRaw = Number(client.plafond);
  if (!Number.isInteger(plafondRaw) || plafondRaw < 5000 || plafondRaw > 1000000) {
    erreurs.push(erreur("plafond", "Le plafond doit être un entier compris entre 5 000 et 1 000 000 centimes."));
  }

  if (!estDateValide(client.creeLe)) {
    erreurs.push(erreur("creeLe", "La date de création doit être une date ISO valide, sans futur."));
  }

  if (erreurs.length > 0) {
    return { ok: false, errors: erreurs };
  }

  return {
    ok: true,
    value: {
      id: client.id ?? "",
      nom,
      telephone,
      plafond: plafondRaw,
      creeLe: client.creeLe,
    },
  };
};

export const validerOperation = (operation, options = {}) => {
  if (!operation || typeof operation !== "object") {
    return {
      ok: false,
      errors: [erreur("operation", "L'opération est obligatoire.")],
    };
  }

  const erreurs = [];
  const clientId = String(operation.clientId ?? "").trim();
  if (!clientId) {
    erreurs.push(erreur("clientId", "Le client est obligatoire."));
  } else if (options.clientIds && !options.clientIds.includes(clientId)) {
    erreurs.push(erreur("clientId", "Ce client n'existe pas."));
  }

  const type = String(operation.type ?? "").trim();
  if (!["achat", "remboursement"].includes(type)) {
    erreurs.push(erreur("type", "Le type doit être 'achat' ou 'remboursement'."));
  }

  const montant = Number(operation.montant);
  if (!Number.isInteger(montant) || montant < 1 || montant > 1000000) {
    erreurs.push(erreur("montant", "Le montant doit être un entier entre 1 et 1 000 000 centimes."));
  }

  const libelle = String(operation.libelle ?? "").trim();
  if (type === "achat" && libelle.length < 2) {
    erreurs.push(erreur("libelle", "Le libellé doit contenir au moins 2 caractères pour un achat."));
  }
  if (libelle.length > 60) {
    erreurs.push(erreur("libelle", "Le libellé ne doit pas dépasser 60 caractères."));
  }

  if (!estDateValide(operation.date)) {
    erreurs.push(erreur("date", "La date doit être une date ISO valide, sans futur."));
  }

  if (erreurs.length > 0) {
    return { ok: false, errors: erreurs };
  }

  return {
    ok: true,
    value: {
      id: operation.id ?? "",
      clientId,
      type,
      montant: montant,
      libelle,
      date: operation.date,
    },
  };
};

export default {
  normaliserTexte,
  enCentimes,
  enTexteMontant,
  formaterMAD,
  aujourdhuiISO,
  validerClient,
  validerOperation,
};
