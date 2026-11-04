
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


function enCentimes(saisie){
    saisie = saisie.replaceAll(',', '.')
    let regex = /^\d+(?:[.,]\d+)?$/
    if(regex.test(saisie)){
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
        valeurs.plafond = saisie.plafond
    }
    if(idEdite == null){
        for(let i = 0; i<clients.length; i++){
            if(clients[i].nom == normaliserText(saisie.nom)){
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
    return {errors, valeurs}
}



