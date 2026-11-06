export function obtenirOperationsClient(clientId, operations) {
    return operations.filter(op => op.clientId === clientId);
}

export function calculerSolde(clientId, operations) {
    let solde = 0;

    const operationsClient = obtenirOperationsClient(clientId, operations);

    operationsClient.forEach(op => {
        if (op.type === "achat") {
            solde += op.montant;
        } else if (op.type === "remboursement") {
            solde -= op.montant;
        }
    });

    return solde;
}

export function calculerCreditDisponible(client, operations) {
    return client.plafond - calculerSolde(client.id, operations);
}

export function obtenirHistorique(clientId, operations) {
    return obtenirOperationsClient(clientId, operations)
        .sort((a, b) => b.date.localeCompare(a.date));
}

export function obtenirDerniereOperation(clientId, operations) {
    const historique = obtenirHistorique(clientId, operations);

    if (historique.length === 0) {
        return null;
    }

    return historique[0];
}


export function obtenirDateReference(clientId, operations) {
    const operationsClient = obtenirOperationsClient(clientId, operations);

    const remboursements = operationsClient.filter(op => op.type === "remboursement");

    if (remboursements.length > 0) {
        remboursements.sort((a, b) => b.date.localeCompare(a.date));
        return remboursements[0].date;
    }

    const achats = operationsClient.filter(op => op.type === "achat");

    if (achats.length > 0) {
        achats.sort((a, b) => a.date.localeCompare(b.date));
        return achats[0].date;
    }

    return null;
}



export function estEnRetard(clientId, operations, aujourdHui) {
    const solde = calculerSolde(clientId, operations);

    if (solde <= 0) {
        return false;
    }

    const dateReference = obtenirDateReference(clientId, operations);

    if (dateReference === null) {
        return false;
    }

    const debut = new Date(dateReference);
    const fin = new Date(aujourdHui);

    const difference = fin - debut;
    const jours = difference / (1000 * 60 * 60 * 24);

    return jours > 30;
}



export function calculerStatut(client, operations, aujourdHui) {
    const solde = calculerSolde(client.id, operations);

    if (solde <= 0) {
        return "À jour";
    }

    if (solde >= client.plafond) {
        return "Plafond atteint";
    }

    if (estEnRetard(client.id, operations, aujourdHui)) {
        return "En retard";
    }

    return "En dette";
}


export function calculerTableauDeBord(clients, operations, aujourdHui) {
    let totalDu = 0;
    let clientsEnDette = 0;
    let clientsEnRetard = 0;

    clients.forEach(client => {
        const solde = calculerSolde(client.id, operations);

        if (solde > 0) {
            totalDu += solde;
            clientsEnDette++;
        }

        if (estEnRetard(client.id, operations, aujourdHui)) {
            clientsEnRetard++;
        }
    });

    return {
        totalDu: totalDu,
        nombreClients: clients.length,
        nombreClientsEnDette: clientsEnDette,
        nombreClientsEnRetard: clientsEnRetard
    };
}
