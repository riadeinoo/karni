///this array is only for experemnting
const operations = [
  {
    id: 1,
    clientId: 1,
    type: "achat",
    montant: 15000, // 150 MAD
    libelle: "Courses alimentaires",
    date: "2026-11-01"
  },
  {
    id: 2,
    clientId: 1,
    type: "achat",
    montant: 7500, // 75 MAD
    libelle: "Pain et lait",
    date: "2026-11-02"
  },
  {
    id: 3,
    clientId: 1,
    type: "remboursement",
    montant: 5000, // 50 MAD
    libelle: "Paiement partiel",
    date: "2026-11-03"
  },
  {
    id: 4,
    clientId: 2,
    type: "achat",
    montant: 20000, // 200 MAD
    libelle: "Produits ménagers",
    date: "2026-11-02"
  },
  {
    id: 5,
    clientId: 2,
    type: "remboursement",
    montant: 10000, // 100 MAD
    libelle: "Remboursement",
    date: "2026-11-04"
  },
  {
    id: 6,
    clientId: 3,
    type: "achat",
    montant: 30000, // 300 MAD
    libelle: "Achats divers",
    date: "2026-11-04"
  }
];

export{soldeClient, operations}

function soldeClient(clientId, operations){
    return operations.reduce((solde, currentOp) => {
        if(currentOp.clientId != clientId){
            return solde
        }
        else if(currentOp.type = "achat"){
            return solde + currentOp.montant
        }
        else if(currentOp.type = "remboursement"){
            return solde - currentOp.montant
        }
        else{
            return solde
        }
    }, 0);
}