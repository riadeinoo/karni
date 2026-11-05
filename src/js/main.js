// Karni — point d'entrée, chargé comme module ES (<script type="module">).
// Lis d'abord le format des données (brief) et le HTML fourni, puis découpe ton code en modules
// (state.js, storage.js, validation.js, calculs.js, ui.js) que tu importes ici.
import { exporterCarnet ,lireFichierImport, } from "./fichier.js";
const btnExporter = document.getElementById("exporter");
btnExporter.addEventListener("click", exporterCarnet);

const inputImport = document.getElementById("import-fichier");
const btnImporter = document.getElementById("importer");

btnImporter.addEventListener("click", () => {
    inputImport.click();
});

inputImport.addEventListener("change", async () => {
    try {
        const fichier = inputImport.files[0];

        const carnet = await lireFichierImport(fichier);

        console.log("Carnet valide :", carnet);

    } catch (erreur) {
        console.error("Erreur :", erreur.message);
    }
});



