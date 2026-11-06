// Karni — point d'entrée, chargé comme module ES (<script type="module">).
// Lis d'abord le format des données (brief) et le HTML fourni, puis découpe ton code en modules
// (state.js, storage.js, validation.js, calculs.js, ui.js) que tu importes ici.

// Importer les fonctions de gestion des données.
import {
    obtenirState,
    validerClient,
    ajouterClient,
    modifierClient,
    supprimerClient,
    calculerSoldeClient
} from "./state.js";
// Importer les fonctions de stockage.
import {
    sauvegarder,
    chargerCarnet,
    genererId
} from "./storage.js";
// Importer les fonctions de validation.
import * as validation from "./validation.js";
// Importer les fonctions d'affichage des clients.
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
// Importer les fonctions de gestion de la fiche client.
import {
    ouvrirFiche,
    fermerFiche,
    renderFiche
} from "./ui-fiche.js";
// Importer les fonctions des fichiers JSON.
import {
    exporterCarnet,
    gererImport,
    gererChargerDemo,
    gererViderCarnet
} from "./fichier.js";
// Importer la confirmation.
import { confirmer } from "./ui-confirmation.js";
// Initialiser l'application.
function init() {
    // Charger les données sauvegardées.
    const resultatChargement = chargerCarnet();

    // Afficher un message si les données sont corrompues.
    if (resultatChargement.erreur) {
       afficherErreurStockage( "Les données sauvegardées sont corrompues. Un carnet vide a été chargé.");
    }
    document.querySelector("#operation-date").value = validation.aujourdhuiISO();
    // Ouvrir le formulaire d'ajout client.
    document.querySelector("#nouveau-client").addEventListener("click", () => {
        ouvrirDialogClient();
    });
    // Fermer le formulaire client.
    document.querySelector("#client-annuler").addEventListener("click", () => {
        document.querySelector("#dialog-client").close();
    });
    // Ajouter ou modifier un client.
    document.querySelector("#form-client").addEventListener("submit", soumettreFormClient);
    // Initialiser les filtres.
    initFiltres(render);

    document.querySelector("#reinitialiser-filtres").addEventListener("click", () => {
        reinitialiserFiltres();
        render();
    });
    // Gérer les actions sur les clients.
    document.querySelector("#liste-clients").addEventListener("click", gererActionClient);
    // Fermer la fiche client.
    document.querySelector("#fiche-fermer").addEventListener("click", fermerFiche);
    // Ajouter une opération.
    document.querySelector("#form-operation").addEventListener("submit", soumettreFormOperation);
    // Supprimer une opération.
    document.querySelector("#historique").addEventListener("click", gererSuppressionOperation);
    // Exporter le carnet.
    document.querySelector("#exporter").addEventListener("click", exporterCarnet);
    // Ouvrir le sélecteur de fichier.
    document.querySelector("#importer").addEventListener("click", () => {
        document.querySelector("#import-fichier").click();
    });
    // Importer un fichier JSON.
    document.querySelector("#import-fichier").addEventListener("change", async () => {
        await gererImport();
        document.querySelector("#import-fichier").value = "";
        render();
    });
    // Charger les données de démonstration.
    document.querySelector("#charger-demo").addEventListener("click", async () => {
        await gererChargerDemo();
        render();
    });
    // Vider le carnet.
    document.querySelector("#vider-carnet").addEventListener("click", async () => {
        await gererViderCarnet();
        render();
    });
    // Afficher les données.
    render();
}
// Actualiser les différentes parties de l'application.
function render() {
    renderListeClients();
    renderTableauDeBord();
    renderEtatsVides();
    renderFiche();
}
// Ajouter ou modifier un client.
function soumettreFormClient(e) {
    e.preventDefault();
    const donnees = lireFormulaireClient();
    const erreurs = validerClient(donnees, donnees.id);
    // Vérifier que le nom du client n'existe pas déjà.
    const clients = obtenirState().clients;
    const nomExiste = clients.some((client) => {
        return client.id !== donnees.id && validation.normaliserText(client.nom) === validation.normaliserText(donnees.nom);
    });
    if (nomExiste) {
        erreurs.nom = "Ce nom existe déjà.";
    }
    afficherErreursClient(erreurs);
    if (Object.keys(erreurs).length > 0) {
        return;
    }
    // Ajouter ou modifier le client.
    const succes = donnees.id
        ? modifierClient(donnees.id, donnees)
        : ajouterClient(donnees);
    if (!succes) {
        afficherErreurStockage("Impossible d'enregistrer le client.");
        return;
    }
    // Sauvegarder les modifications.
    const sauvegarde = sauvegarder();
    document.querySelector("#dialog-client").close();
    if (!sauvegarde) {
        afficherErreurStockage("Le client est ajouté en mémoire, mais sa sauvegarde a échoué.");
    } else {
        afficherNotification(donnees.id ? "Client modifié avec succès.": "Client ajouté avec succès.");
    }
    render();
}
// Gérer les actions sur les clients.
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
        ouvrirFiche(resultat.id);
    }
}
// Supprimer un client.
async function demanderSuppressionClient(id) {
    const solde = calculerSoldeClient(id);
    const client = obtenirState().clients.find((element) => element.id === id);
    if (!client) {
        return;
    }
    if (solde > 0) {
        afficherNotification("Suppression impossible : ce client possède encore une dette.");
        return;
    }
    const accepte = await confirmer({
        titre: "Supprimer ce client ?",
        message: `Voulez-vous vraiment supprimer ${client.nom} ? Ses opérations seront également supprimées.`
    });
    if (!accepte) {
        return;
    }
    const resultat = supprimerClient(id);

    if (!resultat.succes) {
        afficherNotification("Impossible de supprimer ce client.");
        return;
    }
    const sauvegarde = sauvegarder();
    if (!sauvegarde) {
        afficherErreurStockage("La suppression est effectuée en mémoire, mais la sauvegarde a échoué.");
    } else {
        afficherNotification("Client supprimé avec succès.");
    }
    render();
}
// Ajouter une opération.
function soumettreFormOperation(e) {
    e.preventDefault();
    const state = obtenirState();
    const type = document.querySelector(
        'input[name="operation-type"]:checked'
    ).value;
    const saisie = {
        id: genererId("o"),
        type: type,
        montant: document.querySelector("#operation-montant").value,
        date: document.querySelector("#operation-date").value,
        libelle: document.querySelector("#operation-libelle").value.trim()
    };
    // Récupérer le client de la fiche ouverte.
    const clientId = document.querySelector("#fiche-nom").dataset.clientId;
    const clientOperation = state.clients.find((element) => {
        return element.id === clientId;
    });
    const erreurs = {};

    if (!clientOperation) {
        erreurs.clientId = "Client introuvable.";
    }
    // Vérifier la date.
    const aujourdHui = validation.aujourdhuiISO();
    const dateValide =
        /^\d{4}-\d{2}-\d{2}$/.test(saisie.date) &&
        !Number.isNaN(Date.parse(saisie.date)) &&
        new Date(saisie.date + "T00:00:00Z").toISOString().slice(0, 10) === saisie.date &&
        saisie.date <= aujourdHui;
    if (!dateValide) {
        erreurs.date = "Date invalide.";
    }
    if (!clientOperation || Object.keys(erreurs).length > 0) {
        afficherErreursOperation(erreurs);
        return;
    }
    // Vérifier les données de l'opération.
    const resultat = validation.validerOperation(
        saisie,
        clientOperation,
        state.operations
    );
    Object.assign(erreurs, resultat.errors);
    afficherErreursOperation(erreurs);
    if (Object.keys(erreurs).length > 0) {
        return;
    }
    // Créer l'opération.
    const operation = {
        id: saisie.id,
        clientId: resultat.valeurs.clientId,
        type: saisie.type,
        montant: resultat.valeurs.montant,
        libelle: resultat.valeurs.libelle,
        date: saisie.date
    };
    state.operations.push(operation);
    const sauvegarde = sauvegarder();
    if (!sauvegarde) {
        afficherErreurStockage("L'opération est ajoutée en mémoire, mais sa sauvegarde a échoué.");
    } else {
        afficherNotification("Opération ajoutée avec succès.");
    }
    // Vider les champs.
    document.querySelector("#operation-montant").value = "";
    document.querySelector("#operation-libelle").value = "";
    render();
}
// Afficher les erreurs du formulaire opération.
function afficherErreursOperation(erreurs) {
    const champs = [
        "montant",
        "date",
        "libelle"
    ];
    champs.forEach((champ) => {
        const element = document.querySelector(`#operation-${champ}-erreur`);

       element.textContent = erreurs[champ] || "";
       element.classList.toggle("hidden", !erreurs[champ]);
    });
}
// Supprimer une opération.
async function gererSuppressionOperation(e) {
    const bouton = e.target.closest('[data-action="supprimer-operation"]');
    if (!bouton) {
        return;
    }
    const ligne = bouton.closest("[data-operation-id]");
    const operationId = ligne.dataset.operationId;
    const state = obtenirState();
    const operation = state.operations.find((element) => {
        return element.id === operationId;
    });

    if (!operation) {
        return;
    }
    const accepte = await confirmer({
        titre: "Supprimer cette opération ?",
        message: "Voulez-vous vraiment supprimer cette opération ?"
    });

    if (!accepte) {
        return;
    }
    state.operations = state.operations.filter((element) => {
        return element.id !== operationId;
    });
    const sauvegarde = sauvegarder();
    if (!sauvegarde) {
        afficherErreurStockage("L'opération est supprimée en mémoire, mais sa sauvegarde a échoué.");
    } else {
        afficherNotification("Opération supprimée avec succès.");
    }
    render();
}
// Lancer l'application.
init();