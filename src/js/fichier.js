// verifier les donnees du carnet .
import { state } from "./state.js";
import { sauvegarder } from "./storage.js";
import { confirmer } from "./ui-confirmation.js";
import { creerDemo } from "./demo.js";

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
export const lireFichierImport = (fichier) => {
    if(!fichier || (fichier.type !== "application/json" && !fichier.name.toLowerCase().endsWith(".json"))){
        throw new Error("Veuillez sélectionner  un fichier JSON valide.");
    }
    return new Promise((resolve,reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => {
            try{
                const donnees = JSON.parse(lecteur.result);
                const resultat = validerCarnet(donnees);
                if(!resultat.valide){
                    reject(new Error(resultat.erreurs.join("\n")));
                    return;
                }
                resolve(resultat.carnet);
            }catch(erreur){
                reject(erreur);
            }
        };
        lecteur.onerror = () => {
            reject(new Error("Erreur lors de la lecture du fichier."));
        };
        lecteur.readAsText(fichier);
    });        
}

// generer un resume du carnet avec le nombre de clients et  d'operations.
export const resumeCarnet = (carnet) => {
    return `${carnet.clients.length} clients, ${carnet.operations.length} opérations`;
}
// Gérer l'importation d'un carnet JSON après validation et confirmation de l'utilisateur.
export const gererImport= async () =>{
    const inputImport = document.getElementById("import-fichier");
    const fichier = inputImport.files[0];
    if(!fichier){
        return;
    }
    try{
        const carnet = await lireFichierImport(fichier);
        const resume = resumeCarnet(carnet);
        const accepte = await confirmer({
            titre:"importer un carnet",
            message:"voules-vous remplacer le carnet actuel ?",
            details:resume
        });
        if(!accepte){
            return;
        }
        state.clients = carnet.clients;
        state.operations = carnet.operations;
        const sauvegardeReussie = sauvegarder();
        if(!sauvegardeReussie){
            throw new Error("Impossible de sauvegarder le carnet.");
        }
    } catch (erreur) {
        console.error("Erreur lors de l'importation :", erreur.message);
    }
}
// Charger les données de démonstration après confirmation de l'utilisateur
export const gererChargerDemo = async () => {
    try {
        const carnetDemo = creerDemo();
        const accepte = await confirmer({
            titre: "charger la démonstration ",
            message:"Voulez-vous remplacer le carnet actuel par les données de démonstration ?",
            details: resumeCarnet(carnetDemo)
        });
        if (!accepte){
        return;
        }
        state.clients = carnetDemo.clients;
        state.operations = carnetDemo.operations;
        const sauvegardeReussie = sauvegarder();
        if(!sauvegardeReussie){
           throw new Error("Impossible de sauvegarder les données de démonstration.")
        }
    }catch(erreur){
        console.error("Erreur lors du chargement de la démo :", erreur.message);
    }
}
// Vider toutes les données du carnet après confirmation de l'utilisateur
export const gererViderCarnet = async () => {
    try{
        const accepte = await confirmer({
            titre: "Vider le carnet",
            message: "Voulez-vous vraiment supprimer toutes les données du carnet ?",
            details: resumeCarnet(state)
        });
        if(!accepte){
            return;
        }
        state.clients = [];
        state.operations = [];
        const sauvegardeReussie = sauvegarder();
        if(!sauvegardeReussie){
            throw new Error("Impossible de sauvegarder le carnet vide.");
        }
    }catch(erreur){
        console.error("Erreur lors de la suppression du carnet :", erreur.message);
    }
}

