
import { obtenirState, definirState } from "./state.js";
import { validerCarnet } from "./fichier.js";

// generer un identifient inuque
export const genererId = (prefix) => {
    const partieAleatoire= Math.random().toString(36).slice(2, 7);

    return `${prefix}-${partieAleatoire}`;
};
// creer un carnet vide 
export const carnetVide = () => {
    return {
        app:"karni",
        version : 1,
        clients:[],
        operations:[]
    };
}; 
// Sauvegarder les données du carnet dans le localStorage
export const sauvegarder =() =>{
    try{
        const state = obtenirState();
        const carnet = {
            app:"karni",
            version:1,
            clients:state.clients,
            operations:state.operations
        };
        const donnees = JSON.stringify(carnet);
        localStorage.setItem("karni:v1",donnees);
        return true;
    }catch(erreur){
        return false;
    }
};    
// charger les données du carnet depuis le localStorageet verifier leur validite et les restaurer dans l'application
export const chargerCarnet = () => {
    let donnees = null;
    try{
       donnees = localStorage.getItem("karni:v1");
       if(donnees===null){
          const carnet = carnetVide();
          definirState(carnet);
          return {carnet,erreur:false};
        }
        const carnet = JSON.parse(donnees);
        const resultat = validerCarnet(carnet);
        if(!resultat.valide){
            throw new Error("carnet invalide");
        }
        definirState(carnet);
        return {carnet,erreur:false};
    }catch (erreur){
        if(donnees!==null){
           try{
              localStorage.setItem("karni:sauvegarde-illisible",donnees);
            }catch(erreurSauvegarde){
               console.error("Impossible de sauvegarder la sauvegarde la copie:",erreurSauvegarde);
            }
        }
        const carnet = carnetVide();
        definirState(carnet);
        return {carnet,erreur :true};
    }        
} 
    