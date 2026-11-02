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


