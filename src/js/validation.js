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
function validerClient(saisie, clients,isEdite){
    let errors = {}
    let valuers = {}
    const regexNom = /^[p{L}\s'-]{2,40}$/u;
    const regexTel = /^0[567](?:-?\d){8}$/;
    if(!regexNom.test(saisie.nom)){
        errors.nom = "Nom Invalide"
    }
    else{
        valuers.nom = saisie.nom
    }
    if(!regexTel.test(saisie.telephone)){
        errors.telephone
    }
}

