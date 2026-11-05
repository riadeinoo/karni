// verifier les donnees du carnet .
import { state } from "./state.js";

export const validerCarnet = (donnees) => {
    const erreurs = [];
    if(!donnees || typeof donnees !== "object" ||Array.isArray(donnees)){
        erreurs.push("Le carnet doit être un objet valide.");
        return {valide:false,erreurs:erreurs,carnet:null};
    }
    if(donnees.app !== "karni"){
        erreurs.push("app: valeur invalide.");
    }
    if(donnees.version !== 1){
        erreurs.push("version: valeur invalide.");
    }
    if(!Array.isArray(donnees.clients)){
        erreurs.push("clients: doit être un tableau.");
    }
    if(!Array.isArray(donnees.operations)){
        erreurs.push("operations: doit être un tableau.");
    }
    if (!Array.isArray(donnees.clients) || !Array.isArray(donnees.operations)) {
       return { valide: false, erreurs: erreurs.slice(0, 10), carnet: null };
    }
    const idsClients = new Set();
    const idsOperations = new Set();
    donnees.clients.forEach((client,index) =>{
        if (!client || typeof client !== "object" || Array.isArray(client)) {
            erreurs.push(`clients[${index}] : doit être un objet valide.`);
            return;
        }
        if(typeof client.id !=="string" ||client.id.trim()===""){
            erreurs.push(`clients[${index}].id: invalide.`);
        }else if(idsClients.has(client.id)){
            erreurs.push(`clients[${index}].id: dentifiant dupliqué.`);
        }else{
            idsClients.add(client.id);
        }
        if(typeof client.nom !=="string" ||client.nom.trim().length < 2 || client.nom.trim().length > 40 || !/^[\p{L} '-]+$/u.test(client.nom.trim()) ){
            erreurs.push(`clients[${index}].nom: invalide.`);
        }
        if(typeof client.telephone !=="string" || (client.telephone !=="" && !/^0[567]\d{8}$/.test(client.telephone))){
            erreurs.push(`clients[${index}].telephone: invalide.`);
        }
        if(typeof client.plafond !=="number" ||client.plafond< 5000 ||client.plafond > 1000000 || !Number.isInteger(client.plafond)){
            erreurs.push(`clients[${index}].plafond: invalide.`);
        }
        if(typeof client.creeLe !=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(client.creeLe) || new Date(client.creeLe) > new Date()){
            erreurs.push(`clients[${index}].creeLe: invalide.`);
        }
    });
    donnees.operations.forEach((operation,index) =>{
        if(!operation || typeof operation !== "object" || Array.isArray(operation)) {
            erreurs.push(`operations[${index}] : doit être un objet valide.`);
            return;
        }
        if(typeof operation.id !== "string" || operation.id.trim()===""){
            erreurs.push(`operations[${index}].id: invalide.`);
        }else if(idsOperations.has(operation.id)){
            erreurs.push(`operations[${index}].id: dentifiant dupliqué.`);
        }else{
            idsOperations.add(operation.id);
        }
        if(typeof operation.clientId !== "string" || operation.clientId.trim()===""){
            erreurs.push(`operations[${index}].clientId: invalide.`);
        }
        if(operation.type !== "achat" && operation.type !== "remboursement"){
            erreurs.push(`operations[${index}].type: invalide.`);
        }
        if(typeof operation.montant !== "number" || operation.montant < 1 ||operation.montant > 1000000 || !Number.isInteger(operation.montant)){
            erreurs.push(`operations[${index}].montant: invalide.`);
        }
        if(typeof operation.libelle !== "string" || operation.libelle.length > 60 || (operation.type === "achat" && operation.libelle.trim().length < 2)){
            erreurs.push(`operations[${index}].libelle: invalide.`);
        }

        if(typeof operation.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(operation.date) || new Date(operation.date) > new Date()){
            erreurs.push(`operations[${index}].date: invalide.`);
        }
        if (typeof operation.clientId === "string" && operation.clientId.trim() !== "") {
           const clientExiste = donnees.clients.some((client) => client && typeof client === "object" && client.id === operation.clientId);

           if (!clientExiste) {
              erreurs.push(`operations[${index}].clientId : client introuvable.`);
            }
        }
    });
    
    return {
      valide: erreurs.length === 0,
      erreurs: erreurs.slice(0, 10),
      carnet: erreurs.length === 0 ? donnees : null
    };
}
// exporter les données du carnet dans un fichier JSON
export const exporterCarnet = () => {
    const data ={
        app:"karni",
        version:1,
        clients:state.clients,
        operations:state.operations,
        exporteLe: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const nomFichier = `karni-${date}.json`;
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    lien.click();
    URL.revokeObjectURL(url);
}
// lire un fichier JSON importe et recuperer son contenu.
export const lireFichierImport = async (fichier) => {
    if(!fichier || fichier.type !== "application/json") {
        throw new Error("Veuillez sélectionner  un fichier JSON valide.");
    }
    const contenu = await fichier.text();
    const donnees = JSON.parse(contenu); 
    const resultat = validerCarnet(donnees);
    if(!resultat.valide){
        throw new Error(resultat.erreurs.join("\n"));
    }
    return resultat.carnet;
}
// generer un resume du carnet avec le nombre de clients et  d'operations.
