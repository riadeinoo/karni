
//this array is only for testing
const clients = [
  {
    id: 1,
    nom: "Ahmed Benali",
    telephone: "0612345678",
    plafond: 50000,
    creeLe: "2026-11-01"
  },
  {
    id: 2,
    nom: "Fatima Zahra",
    telephone: "0712345678",
    plafond: 150000,
    creeLe: "2026-11-02"
  },
  {
    id: 3,
    nom: "Youssef El Amrani",
    telephone: "",
    plafond: 100000,
    creeLe: "2026-11-03"
  },
  {
    id: 4,
    nom: "  ahmed   BENALI ",
    telephone: "0512345678",
    plafond: 25000,
    creeLe: "2026-11-04"
  }
];

import { soldeClient, operations } from "./calculs.js";

function enCentimes(saisie){
    saisie = String(saisie).trim().replaceAll(',', '.')
    let regex = /^\d+(?:\.\d{1,2})?$/;
    if(regex.test(saisie)){
        saisie = Number(saisie)
        return Math.round(saisie * 100)
    }
    else{
        return null;
    }
}
function enTexteMontant(centimes){
    centimes = Number(centimes)
    if(Number.isNaN(centimes)){
        return null
    }
    return (centimes/100).toFixed(2)
}
function formaterMAD(centimes){
    return enTexteMontant(centimes) + " MAD"
}
function normaliserText(text){
    ///NFD seperates the accent from the letter then replace removes the accent and keeps the letter
    text = text.toLowerCase()
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    text = text.trim()
    return text;
}
function aujourdhuiISO(){
    let date = new Date().toISOString().split('T')
    return date[0]
}
//saise is an obj with nom, telephone, plafond/ clients is the array with all clients/ idEdite is the id of modified client, null if to-add
//this function return two objects, valeurs which are values that passed, and errors
//plafond currently is entered in MAD and stored in centimes
function validerClient(saisie, clients,idEdite){
    let errors = {}
    let valeurs = {}
    const regexNom = /^[\p{L}\s'-]{2,40}$/u;
    const regexTel = /^0[567]\d{8}$/;
    if(!regexNom.test(saisie.nom)){
        errors.nom = "Nom Invalide"
    }
    else{
        valeurs.nom = saisie.nom
    }
    if(!regexTel.test(saisie.telephone)){
        errors.telephone = "nombre est invalide"
    }
    else{
        valeurs.telephone = saisie.telephone
    }
    saisie.plafond = Number(saisie.plafond)
    if(isNaN(saisie.plafond) || saisie.plafond < 50 || saisie.plafond > 10000){
        errors.plafond = "valeur invalide"
    }
    else{
        valeurs.plafond = enCentimes(saisie.plafond)
    }
    if(idEdite == null){
        for(let i = 0; i<clients.length; i++){
            if(normaliserText(clients[i].nom) == normaliserText(saisie.nom)){
                errors.nom = "Ce nom deja Exist"
                break;
            }
        }
    }
    else{
        outerLoop:
        for(let i = 0; i<clients.length; i++){
            if(clients[i].id == idEdite){
                for(let j = 0; j<clients.length; j++){
                    if(normaliserText(clients[j].nom) == normaliserText(saisie.nom) && normaliserText(clients[j].nom) != normaliserText(clients[i].nom)){
                        errors.nom = "ce nom deja Exist"
                        valeurs.id = -1;
                        break outerLoop;
                    }
                }
                valeurs.id = idEdite
                break outerLoop
            }
        }
        if(!valeurs.id){
            errors.id = "Ce id n'exist pas"
        }
    }
    return {valeurs, errors}
}

function validerOperation(saisie, client, operations) {
    let montant = enCentimes(saisie.montant)
    const errors = {}
    const valeurs = {}
    if(montant == null || montant < 1 || montant > 1000000  ){
        errors.montant = "montant invalide(entre 0.01 et 10 000 MAD"
    }
    if(saisie.type != "achat" && saisie.type != "remboursement"){
        errors.type = "ce type n'exist pas"
    }
    else{
        if(!client || client.id == null){
            errors.clientId = "le client n'exist pas!"
        }
        else{
            valeurs.clientId = client.id
            let solde = soldeClient(client.id, operations)
            if(saisie.type == "achat"){
                if(Number(solde) + montant > client.plafond){
                    errors.montant = "cette montant a depasser le plafond de client"
                }
                else{
                    valeurs.montant = montant;
                }
            }
            else{
                if(montant > solde){
                    errors.montant = "la valeur depasse kridi de client"
                }
                else{
                    valeurs.montant = montant
                }
            }
        }
    }
    if(saisie.libelle == null || saisie.libelle.length < 2 || saisie.libelle.length>60){
        errors.libelle = "Nombre de characters entre 2 et 60"
    }
    else{
        valeurs.libelle = saisie.libelle
    }
    for(let i = 0 ; i<operations.length; i++){
        if(operations[i].id == saisie.id){
            errors.id = "ce id deja exists"
            break;
        }
    }
    if(!errors.id){
        valeurs.id = saisie.id
    }
    //add date validation

    return {valeurs, errors}

}
